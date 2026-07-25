"""
Client serializers.

This module contains serializers for client data.
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model

from ..models import Client
from .user import UserSerializer

User = get_user_model()


class ClientSerializer(serializers.ModelSerializer):
    """Serializer for client data."""

    owner = UserSerializer(read_only=True)
    owner_id = serializers.PrimaryKeyRelatedField(
        source="owner", queryset=User.objects.all(), write_only=True, required=False
    )

    class Meta:
        model = Client
        fields = "__all__"
    
    def create(self, validated_data):
        """Create a new client with tenant."""
        request = self.context.get("request")
        
        # Get tenant_id from request (set by middleware)
        tenant_id = None
        if hasattr(request, 'tenant_id'):
            tenant_id = request.tenant_id
        elif hasattr(request, 'tenant') and request.tenant:
            tenant_id = request.tenant.id
        
        if not tenant_id:
            raise serializers.ValidationError({"tenant": "Tenant not found. Please ensure you're accessing via correct subdomain."})
        
        # Set owner if not provided
        if not validated_data.get("owner") and request.user:
            validated_data["owner"] = request.user
        
        return Client.objects.create(tenant_id=tenant_id, **validated_data)

