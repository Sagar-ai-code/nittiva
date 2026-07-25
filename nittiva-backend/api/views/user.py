"""
User views.

This module contains viewsets for user management.
"""

from django.contrib.auth import get_user_model
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import permissions, viewsets, status
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from ..permissions import IsAdminOrReadOnly
from ..serializers import UserSerializer
from ..utils.tenant import get_current_tenant_id
from ..utils.responses import success_response

User = get_user_model()


class UserViewSet(viewsets.ModelViewSet):
    """ViewSet for user management."""

    serializer_class = UserSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["role", "is_active", "is_staff"]
    permission_classes = [permissions.IsAuthenticated, IsAdminOrReadOnly]
    
    def get_queryset(self):
        """Get queryset filtered by tenant."""
        tenant_id = get_current_tenant_id(self.request)
        
        if not tenant_id:
            raise ValidationError("Tenant not found. Please ensure you're accessing via correct subdomain or X-Tenant-Subdomain header.")
        
        return User.objects.filter(tenant_id=tenant_id).order_by("-created_at")
    
    def perform_create(self, serializer):
        """Create user with tenant set from request context."""
        tenant_id = get_current_tenant_id(self.request)
        if not tenant_id:
            raise ValidationError("Tenant not found.")
        serializer.save(tenant_id=tenant_id)
    
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def me(self, request):
        """Get current user profile.
        
        This endpoint works for all authenticated users, including superusers
        who may not have a tenant_id set.
        """
        # For superusers, don't require tenant
        # For regular users, tenant is already validated by middleware
        serializer = self.get_serializer(request.user)
        return success_response(
            data=serializer.data,
            message="Profile retrieved successfully",
        )

