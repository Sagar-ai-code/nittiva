"""
Custom Field serializers.

This module contains serializers for custom field data.
"""

from django.db import models
from rest_framework import serializers
from ..models import CustomField


class CustomFieldSerializer(serializers.ModelSerializer):
    """Serializer for custom field data."""
    
    class Meta:
        model = CustomField
        fields = [
            "id",
            "name",
            "field_type",
            "width",
            "options",
            "order",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
    
    def create(self, validated_data):
        """Create a new custom field with tenant."""
        request = self.context.get("request")
        
        # Get tenant_id from request (set by middleware)
        tenant_id = None
        if hasattr(request, 'tenant_id'):
            tenant_id = request.tenant_id
        elif hasattr(request, 'tenant') and request.tenant:
            tenant_id = request.tenant.id
        
        if not tenant_id:
            raise serializers.ValidationError({"tenant": "Tenant not found. Please ensure you're accessing via correct subdomain or X-Company-ID header."})
        
        # Set order if not provided (put at end)
        if "order" not in validated_data:
            max_order = CustomField.objects.filter(tenant_id=tenant_id).aggregate(
                max_order=models.Max("order")
            )["max_order"] or 0
            validated_data["order"] = max_order + 1
        
        field = CustomField(tenant_id=tenant_id, **validated_data)
        field.save()
        return field
