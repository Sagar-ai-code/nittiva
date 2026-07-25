"""
Password reset views.

This module contains views for password reset functionality.
"""

from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes
from django.contrib.auth import get_user_model
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes

from ..serializers import PasswordResetRequestSerializer, PasswordResetSerializer
from ..services.password_reset import PasswordResetService
from ..utils.responses import success_response, error_response

User = get_user_model()


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def request_password_reset(request):
    """
    Request password reset - sends email with reset link.
    
    POST /password/email
    Body: { "email": "user@example.com" }
    """
    serializer = PasswordResetRequestSerializer(data=request.data)
    
    if not serializer.is_valid():
        return error_response(
            message="Invalid request",
            errors=serializer.errors,
            status_code=status.HTTP_400_BAD_REQUEST,
        )
    
    email = serializer.validated_data.get("email")
    
    try:
        user = User.objects.get(email=email)
        
        # Only allow password reset for email-based auth users
        if user.auth_provider != "email":
            return error_response(
                message=f"This account uses {user.auth_provider} authentication. Please sign in with {user.auth_provider}.",
                status_code=status.HTTP_400_BAD_REQUEST,
            )
        
        # Generate reset token
        uidb64, token = PasswordResetService.generate_reset_token(user)
        
        # Get frontend URL from request or settings
        frontend_url = request.headers.get('Origin') or request.build_absolute_uri('/')
        if frontend_url.endswith('/'):
            frontend_url = frontend_url[:-1]
        
        # Build reset URL
        reset_url = f"{frontend_url}/reset-password?token={uidb64}:{token}&email={email}"
        
        # Send email
        email_sent = PasswordResetService.send_reset_email(user, reset_url)
        
        # In development mode, always include reset link in response for easy access
        from django.conf import settings
        response_data = {
            "message": "Password reset link has been sent to your email",
            "reset_link": reset_url  # Always include in response for development
        }
        
        # Add note in development mode
        if getattr(settings, 'DEBUG', False):
            response_data["note"] = "Development mode: Email printed to Django console. Use reset_link above to reset password."
            # Also print to console for immediate visibility
            import sys
            print("\n" + "="*80, file=sys.stderr, flush=True)
            print("🔗🔗🔗 PASSWORD RESET LINK - COPY THIS URL 🔗🔗🔗", file=sys.stderr, flush=True)
            print("="*80, file=sys.stderr, flush=True)
            print(reset_url, file=sys.stderr, flush=True)
            print("="*80 + "\n", file=sys.stderr, flush=True)
        
        if email_sent:
            # Always return success for security (don't reveal if email exists)
            return success_response(
                data=response_data,
                message="If an account with that email exists, a password reset link has been sent.",
                status_code=status.HTTP_200_OK,
            )
        else:
            return error_response(
                message="Failed to send password reset email. Please try again later.",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
    
    except User.DoesNotExist:
        # Don't reveal if email exists for security
        return success_response(
            data={"message": "Password reset link has been sent to your email"},
            message="If an account with that email exists, a password reset link has been sent.",
            status_code=status.HTTP_200_OK,
        )
    except Exception as e:
        # Log detailed error for debugging
        import sys
        import traceback
        print("\n" + "="*80, file=sys.stderr)
        print("❌ ERROR in request_password_reset", file=sys.stderr)
        print("="*80, file=sys.stderr)
        print(f"Error Type: {type(e).__name__}", file=sys.stderr)
        print(f"Error Message: {str(e)}", file=sys.stderr)
        print("\nFull Traceback:", file=sys.stderr)
        print(traceback.format_exc(), file=sys.stderr)
        print("="*80 + "\n", file=sys.stderr)
        sys.stderr.flush()
        
        return error_response(
            message="An error occurred while processing your request",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def reset_password(request):
    """
    Reset password using token.
    
    POST /password/reset
    Body: {
        "email": "user@example.com",
        "token": "uidb64:token",
        "password": "newpassword",
        "password_confirmation": "newpassword"
    }
    """
    serializer = PasswordResetSerializer(data=request.data)
    
    if not serializer.is_valid():
        return error_response(
            message="Invalid request",
            errors=serializer.errors,
            status_code=status.HTTP_400_BAD_REQUEST,
        )
    
    email = serializer.validated_data.get("email")
    token_string = serializer.validated_data.get("token")
    password = serializer.validated_data.get("password")
    
    try:
        # Parse token (format: "uidb64:token")
        if ':' not in token_string:
            return error_response(
                message="Invalid reset token format",
                status_code=status.HTTP_400_BAD_REQUEST,
            )
        
        uidb64, token = token_string.split(':', 1)
        
        # Get user from token
        user = PasswordResetService.get_user_from_token(uidb64, token)
        
        if not user:
            return error_response(
                message="Invalid or expired reset token",
                status_code=status.HTTP_400_BAD_REQUEST,
            )
        
        # Verify email matches
        if user.email != email:
            return error_response(
                message="Email does not match reset token",
                status_code=status.HTTP_400_BAD_REQUEST,
            )
        
        # Only allow password reset for email-based auth users
        if user.auth_provider != "email":
            return error_response(
                message=f"This account uses {user.auth_provider} authentication.",
                status_code=status.HTTP_400_BAD_REQUEST,
            )
        
        # Set new password
        user.set_password(password)
        user.save()
        
        return success_response(
            data={"message": "Password has been reset successfully"},
            message="Password reset successful. You can now login with your new password.",
            status_code=status.HTTP_200_OK,
        )
    
    except Exception as e:
        return error_response(
            message=f"Password reset failed: {str(e)}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

