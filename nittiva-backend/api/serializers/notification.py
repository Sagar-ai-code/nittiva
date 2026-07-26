"""
Notification serializers.
"""
from rest_framework import serializers
from ..models import Notification
from .user import UserSerializer


class NotificationSerializer(serializers.ModelSerializer):
    recipient = UserSerializer(read_only=True)

    class Meta:
        model = Notification
        fields = [
            "id",
            "recipient",
            "type",
            "title",
            "message",
            "link",
            "is_read",
            "read_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "recipient", "read_at", "created_at", "updated_at"]

    def create(self, validated_data):
        request = self.context.get("request")
        tenant_id = getattr(request, "tenant_id", None)
        if not tenant_id:
            raise serializers.ValidationError({"tenant": "Tenant not found."})
        validated_data["tenant_id"] = tenant_id
        if "recipient" not in validated_data:
            validated_data["recipient"] = request.user
        return super().create(validated_data)

    def update(self, instance, validated_data):
        from django.utils import timezone
        if "is_read" in validated_data:
            if validated_data["is_read"] and not instance.is_read:
                validated_data["read_at"] = timezone.now()
            elif not validated_data["is_read"] and instance.is_read:
                validated_data["read_at"] = None
        return super().update(instance, validated_data)
