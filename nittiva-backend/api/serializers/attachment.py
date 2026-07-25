"""
Attachment serializers.

This module contains serializers for attachment data.
"""
from rest_framework import serializers
from ..models import Attachment
from .user import UserSerializer


class AttachmentSerializer(serializers.ModelSerializer):
    """Serializer for attachments."""
    
    uploaded_by = UserSerializer(read_only=True)
    file_size_mb = serializers.SerializerMethodField()
    
    class Meta:
        model = Attachment
        fields = [
            "id",
            "content_type",
            "object_id",
            "file_name",
            "file_size",
            "file_size_mb",
            "file_type",
            "file_url",
            "uploaded_by",
            "created_at",
        ]
        read_only_fields = ["id", "uploaded_by", "created_at"]
    
    def get_file_size_mb(self, obj):
        """Get file size in MB."""
        return round(obj.file_size / (1024 * 1024), 2)
    
    def create(self, validated_data):
        request = self.context.get("request")
        tenant_id = getattr(request, 'tenant_id', None)
        
        if not tenant_id:
            raise serializers.ValidationError({"tenant": "Tenant not found."})
        
        validated_data["tenant_id"] = tenant_id
        validated_data["uploaded_by"] = request.user
        
        return super().create(validated_data)
