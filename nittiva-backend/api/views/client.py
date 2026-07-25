"""
Client views.

This module contains viewsets for client management.
"""

from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import permissions, viewsets
from rest_framework.exceptions import ValidationError

from ..models import Client
from ..serializers import ClientSerializer
from ..utils.tenant import get_current_tenant_id


class ClientViewSet(viewsets.ModelViewSet):
    """ViewSet for client management."""

    serializer_class = ClientSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["status", "company"]
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Get queryset filtered by tenant."""
        tenant_id = get_current_tenant_id(self.request)
        
        if not tenant_id:
            raise ValidationError("Tenant not found. Please ensure you're accessing via correct subdomain or X-Tenant-Subdomain header.")
        
        return Client.objects.filter(tenant_id=tenant_id).order_by("-created_at")
    
    def perform_create(self, serializer):
        """Create client with tenant set from request context."""
        tenant_id = get_current_tenant_id(self.request)
        if not tenant_id:
            raise ValidationError("Tenant not found.")
        serializer.save(tenant_id=tenant_id)

