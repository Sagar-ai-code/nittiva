"""
Authentication views.

This module contains views for authentication, registration, and health checks.
"""

from django.db import connection
from django.http import JsonResponse
from rest_framework import permissions, status, serializers
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from django.contrib.auth import get_user_model
from ..serializers import RegisterSerializer, UserSerializer, GoogleAuthSerializer
from ..utils.responses import success_response, error_response
from ..utils.tenant import get_current_tenant_id

User = get_user_model()

# Import GoogleAuthService only when needed (lazy import)
try:
    from ..services.google_auth import GoogleAuthService
    GOOGLE_AUTH_AVAILABLE = True
except ImportError:
    GOOGLE_AUTH_AVAILABLE = False
    GoogleAuthService = None


class LoginSerializer(TokenObtainPairSerializer):
    """Custom login serializer with tenant validation via company_id."""
    
    company_id = serializers.CharField(write_only=True, required=False, allow_blank=True, help_text="Company ID (optional for superusers)")
    email = serializers.CharField(required=True, help_text="Username or email")
    
    @classmethod
    def get_token(cls, user):
        """Add custom claims to token."""
        token = super().get_token(user)
        token["email"] = user.email
        token["name"] = getattr(user, "name", "")
        token["role"] = getattr(user, "role", "user")
        token["is_superuser"] = user.is_superuser
        token["is_staff"] = user.is_staff
        return token
    
    def validate_email(self, value):
        """Convert username to email format if needed."""
        if not value or not value.strip():
            raise serializers.ValidationError("Username is required.")
        value = value.strip()
        # If no @, append @example.com to match stored format
        if '@' not in value:
            value = f"{value}@example.com"
        return value.lower()
    
    def validate(self, attrs):
        """Validate credentials and company_id."""
        company_id = attrs.get("company_id", "").upper().strip()
        # Normalize email/username
        email = attrs.get("email", "").strip()
        if '@' not in email:
            email = f"{email}@example.com"
        attrs["email"] = email.lower()
        
        # Validate user credentials first
        data = super().validate(attrs)
        user = self.user  # User object from super().validate
        
        # Superusers and staff can login without company_id (for admin panel)
        if user.is_superuser or user.is_staff:
            # Allow admin login without company_id validation
            if not company_id or company_id == "ADMIN":
                return data
            # If they provide a company_id, validate it but don't require it
            if company_id:
                from ..models import Tenant
                try:
                    tenant = Tenant.objects.get(company_id=company_id, is_active=True)
                    # Superusers can login to any tenant
                    return data
                except Tenant.DoesNotExist:
                    # Even if tenant doesn't exist, superusers can still login
                    return data
        
        # AGENTS MUST ALWAYS PROVIDE COMPANY_ID - NO EXCEPTIONS
        # Managers can login without company_id (backend will find from user.tenant_id)
        if not company_id:
            # Only managers can login without company_id
            if user.role == "manager" and user.tenant_id:
                from ..models import Tenant
                try:
                    tenant = Tenant.objects.get(id=user.tenant_id, is_active=True)
                    # Manager login successful
                    return data
                except Tenant.DoesNotExist:
                    pass
            
            # For agents or if manager has no tenant, require company_id
            if user.role == "agent":
                raise serializers.ValidationError({
                    "company_id": "Company ID is required for agent login. Please enter your company ID."
                })
            raise serializers.ValidationError({
                "company_id": "Company ID is required. Please contact your administrator."
            })
        
        # Look up tenant by company_id
        from ..models import Tenant
        try:
            tenant = Tenant.objects.get(company_id=company_id, is_active=True)
        except Tenant.DoesNotExist:
            raise serializers.ValidationError({
                "company_id": f"Invalid company ID '{company_id}'. Please check with your administrator."
            })
        
        # Validate that user belongs to the tenant
        if not user.tenant_id:
            raise serializers.ValidationError({
                "detail": "User is not associated with any tenant. Please contact support."
            })
        
        # STRICT VALIDATION: company_id MUST match user's tenant
        # Convert both to strings for comparison to handle UUID properly
        user_tenant_id_str = str(user.tenant_id)
        tenant_id_str = str(tenant.id)
        
        if user_tenant_id_str != tenant_id_str:
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(
                f"Login rejected: user {user.email} (tenant_id={user_tenant_id_str}, role={user.role}) "
                f"attempted login with company_id '{company_id}' (tenant_id={tenant_id_str})"
            )
            # For agents, provide more specific error message
            if user.role == "agent":
                raise serializers.ValidationError({
                    "company_id": f"Agent account does not belong to company '{company_id}'. Please verify your company ID and try again."
                })
            raise serializers.ValidationError({
                "company_id": f"User does not belong to company '{company_id}'. Please check your company ID."
            })
        
        return data


class LoginView(TokenObtainPairView):
    """Login view that returns JWT tokens."""

    serializer_class = LoginSerializer

    def post(self, request, *args, **kwargs):
        """Handle login request with tenant validation via company_id."""
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
            
            # Get user from validated data
            user = serializer.user
            
            # Superusers and staff can login from any tenant (bypass tenant check)
            # But they still need to provide company_id for context
            # Regular users must belong to the tenant specified by company_id
            # This is already validated in the serializer
            
            # Include user data in response for frontend
            user_data = UserSerializer(user).data
            
            return success_response(
                data={
                    **serializer.validated_data,  # Includes access and refresh tokens
                    "user": user_data,  # Include full user data with is_superuser
                },
                message="Login successful",
                status_code=status.HTTP_200_OK,
            )
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Login failed: {e}", exc_info=True)
            
            # Check if it's a validation error with company_id
            if hasattr(e, 'detail') and isinstance(e.detail, dict):
                if 'company_id' in e.detail:
                    return error_response(
                        message=e.detail['company_id'][0] if isinstance(e.detail['company_id'], list) else str(e.detail['company_id']),
                        errors=e.detail,
                        status_code=status.HTTP_400_BAD_REQUEST,
                    )
            
            return error_response(
                message="Invalid credentials. Please check email, password, and company ID.",
                errors=str(e),
                status_code=status.HTTP_401_UNAUTHORIZED,
            )


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def register(request):
    """User registration endpoint (Manager and Agent)."""
    serializer = RegisterSerializer(data=request.data, context={"request": request})
    
    if not serializer.is_valid():
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Registration validation failed: {serializer.errors}")
        return error_response(
            message="Registration failed",
            errors=serializer.errors,
            status_code=status.HTTP_400_BAD_REQUEST,
        )
    
    try:
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        
        # Prepare response data
        response_data = {
            "user": UserSerializer(user).data,
            "access_token": str(refresh.access_token),
            "refresh_token": str(refresh),
        }
        
        # If manager registration, include company_id in response
        created_company_id = serializer.context.get('created_company_id')
        if created_company_id:
            response_data["company_id"] = created_company_id
            response_data["message"] = f"Manager account created successfully! Your Company ID is: {created_company_id}"
        else:
            response_data["message"] = "User registered successfully"
        
        return success_response(
            data=response_data,
            message=response_data.get("message", "User registered successfully"),
            status_code=status.HTTP_201_CREATED,
        )
    except Exception as e:
        import logging
        import traceback
        logger = logging.getLogger(__name__)
        logger.error(f"Registration error: {str(e)}\n{traceback.format_exc()}")
        
        return error_response(
            message=f"Registration failed: {str(e)}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def healthz(request):
    """Lightweight liveness probe."""
    return JsonResponse({"status": "ok"}, status=200)


@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def readyz(request):
    """Readiness probe that also checks DB connectivity."""
    try:
        connection.ensure_connection()
        return JsonResponse({"status": "ok", "db": "ok"}, status=200)
    except Exception as exc:
        return JsonResponse({"status": "error", "db": str(exc)}, status=500)


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def google_auth(request):
    """Authenticate user with Google OAuth token."""
    if not GOOGLE_AUTH_AVAILABLE:
        return error_response(
            message="Google authentication is not available. Please install google-auth package.",
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        )
    
    serializer = GoogleAuthSerializer(data=request.data)
    
    if not serializer.is_valid():
        return error_response(
            message="Invalid request data",
            errors=serializer.errors,
            status_code=status.HTTP_400_BAD_REQUEST,
        )
    
    token = serializer.validated_data.get("token")
    
    try:
        # Verify Google token and get user info
        google_user_info = GoogleAuthService.verify_token(token)
        
        google_id = google_user_info.get("google_id")
        email = google_user_info.get("email")
        name = google_user_info.get("name", "")
        picture = google_user_info.get("picture", "")
        
        if not email:
            return error_response(
                message="Google account does not have an email address",
                status_code=status.HTTP_400_BAD_REQUEST,
            )
        
        # Check if user exists by Google ID or email
        user = None
        is_new_user = False
        
        # First, try to find by Google ID
        if google_id:
            try:
                user = User.objects.get(google_id=google_id)
            except User.DoesNotExist:
                pass
        
        # If not found by Google ID, try to find by email
        if not user:
            try:
                user = User.objects.get(email=email)
                # Link Google ID to existing user if not already linked
                if not user.google_id:
                    user.google_id = google_id
                    user.auth_provider = "google"
                    if picture and not user.profile_image_url:
                        user.profile_image_url = picture
                    user.save()
            except User.DoesNotExist:
                # Create new user
                is_new_user = True
                user = User.objects.create(
                    email=email,
                    name=name or email.split("@")[0],
                    google_id=google_id,
                    profile_image_url=picture,
                    auth_provider="google",
                )
                user.set_unusable_password()  # No password needed for OAuth users
                user.save()
        else:
            # Update user info if needed
            if picture and user.profile_image_url != picture:
                user.profile_image_url = picture
            if name and user.name != name:
                user.name = name
            user.save()
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        access_token = refresh.access_token
        
        # Add custom claims to token
        access_token["email"] = user.email
        access_token["name"] = user.name
        access_token["role"] = user.role
        
        return success_response(
            data={
                "user": UserSerializer(user).data,
                "access_token": str(access_token),
                "refresh_token": str(refresh),
                "isNewUser": is_new_user,
            },
            message="Google authentication successful",
            status_code=status.HTTP_200_OK,
        )
    
    except ValueError as e:
        return error_response(
            message=str(e),
            status_code=status.HTTP_400_BAD_REQUEST,
        )
    except Exception as e:
        return error_response(
            message=f"Google authentication failed: {str(e)}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

