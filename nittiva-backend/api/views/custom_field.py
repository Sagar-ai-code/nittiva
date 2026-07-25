"""
Custom Field views.

This module contains viewsets for custom field management.
"""

from rest_framework import permissions, viewsets
from rest_framework.exceptions import ValidationError

from ..models import CustomField
from ..serializers import CustomFieldSerializer
from ..utils.tenant import get_current_tenant_id


class CustomFieldViewSet(viewsets.ModelViewSet):
    """
    ViewSet for custom field management.
    
    - All authenticated users can manage custom fields for their tenant
    """
    
    serializer_class = CustomFieldSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Get queryset filtered by tenant."""
        tenant_id = get_current_tenant_id(self.request)
        
        if not tenant_id:
            raise ValidationError("Tenant not found. Please ensure you're accessing via correct subdomain or X-Company-ID header.")
        
        return CustomField.objects.filter(tenant_id=tenant_id).order_by("order", "name")
    
    def perform_create(self, serializer):
        """Create custom field with tenant."""
        serializer.save()
