"""
Tenant views.

This module contains viewsets for tenant management (super-admin only).
"""

from rest_framework import permissions, viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError, PermissionDenied

from ..models import Tenant
from ..serializers import TenantSerializer
from ..permissions import IsSuperUser
from ..utils.responses import success_response, error_response


class TenantViewSet(viewsets.ModelViewSet):
    """
    ViewSet for tenant management.
    
    Only superusers can create, update, or delete tenants.
    Regular authenticated users can view tenant details (for their own tenant).
    """
    
    queryset = Tenant.objects.all().order_by('-created_at')
    serializer_class = TenantSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_permissions(self):
        """Override permissions based on action."""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            # Only superusers can modify tenants
            return [permissions.IsAuthenticated(), IsSuperUser()]
        # Regular users can view (for their own tenant info)
        return [permissions.IsAuthenticated()]
    
    def get_queryset(self):
        """Get queryset based on user permissions."""
        user = self.request.user
        
        # Superusers can see all tenants
        if user.is_superuser:
            return Tenant.objects.all().order_by('-created_at')
        
        # Regular users can only see their own tenant
        if hasattr(user, 'tenant_id') and user.tenant_id:
            return Tenant.objects.filter(id=user.tenant_id)
        
        # No tenant access
        return Tenant.objects.none()
    
    def list(self, request, *args, **kwargs):
        """List all tenants (with custom response format)."""
        queryset = self.filter_queryset(self.get_queryset())
        
        # Check if pagination is enabled
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            # Return paginated data in custom format
            return success_response(
                data=serializer.data,
                message="Tenants retrieved successfully",
            )
        
        # If no pagination, return all results
        serializer = self.get_serializer(queryset, many=True)
        return success_response(
            data=serializer.data,
            message="Tenants retrieved successfully",
        )
    
    def create(self, request, *args, **kwargs):
        """Create a new tenant (superuser only)."""
        if not request.user.is_superuser:
            return error_response(
                message="Only superusers can create tenants.",
                status_code=status.HTTP_403_FORBIDDEN,
            )
        
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            tenant = serializer.save()
            return success_response(
                data=TenantSerializer(tenant).data,
                message=f"Tenant '{tenant.name}' created successfully",
                status_code=status.HTTP_201_CREATED,
            )
        
        return error_response(
            message="Failed to create tenant",
            errors=serializer.errors,
            status_code=status.HTTP_400_BAD_REQUEST,
        )
    
    def update(self, request, *args, **kwargs):
        """Update a tenant (superuser only)."""
        if not request.user.is_superuser:
            return error_response(
                message="Only superusers can update tenants.",
                status_code=status.HTTP_403_FORBIDDEN,
            )
        
        return super().update(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        """Delete a tenant (superuser only)."""
        if not request.user.is_superuser:
            return error_response(
                message="Only superusers can delete tenants.",
                status_code=status.HTTP_403_FORBIDDEN,
            )
        
        tenant = self.get_object()
        
        # Check if tenant has users
        from django.contrib.auth import get_user_model
        User = get_user_model()
        user_count = User.objects.filter(tenant_id=tenant.id).count()
        
        if user_count > 0:
            return error_response(
                message=f"Cannot delete tenant with {user_count} user(s). Please remove all users first.",
                status_code=status.HTTP_400_BAD_REQUEST,
            )
        
        tenant_name = tenant.name
        tenant.delete()
        
        return success_response(
            message=f"Tenant '{tenant_name}' deleted successfully",
            status_code=status.HTTP_200_OK,
        )
    
    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """Activate a tenant (superuser only)."""
        if not request.user.is_superuser:
            return error_response(
                message="Only superusers can activate tenants.",
                status_code=status.HTTP_403_FORBIDDEN,
            )
        
        tenant = self.get_object()
        tenant.is_active = True
        tenant.save()
        
        return success_response(
            data=TenantSerializer(tenant).data,
            message=f"Tenant '{tenant.name}' activated",
        )
    
    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        """Deactivate a tenant (superuser only)."""
        if not request.user.is_superuser:
            return error_response(
                message="Only superusers can deactivate tenants.",
                status_code=status.HTTP_403_FORBIDDEN,
            )
        
        tenant = self.get_object()
        tenant.is_active = False
        tenant.save()
        
        return success_response(
            data=TenantSerializer(tenant).data,
            message=f"Tenant '{tenant.name}' deactivated",
        )
