"""
Todo serializers.
"""
from rest_framework import serializers
from ..models import Todo
from .user import UserSerializer


class TodoSerializer(serializers.ModelSerializer):
    """Serializer for todos."""

    owner = UserSerializer(read_only=True)
    assigned_to = UserSerializer(read_only=True)
    assigned_to_id = serializers.PrimaryKeyRelatedField(
        queryset=Todo._meta.get_field("assigned_to").related_model.objects.all(),
        source="assigned_to",
        write_only=True,
        required=False,
        allow_null=True,
    )

    class Meta:
        model = Todo
        fields = [
            "id",
            "title",
            "description",
            "completed",
            "completed_at",
            "owner",
            "assigned_to",
            "assigned_to_id",
            "project_id",
            "due_date",
            "priority",
            "position",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "owner", "completed_at", "created_at", "updated_at"]

    def create(self, validated_data):
        request = self.context.get("request")
        tenant_id = getattr(request, "tenant_id", None)
        if not tenant_id:
            raise serializers.ValidationError({"tenant": "Tenant not found."})
        validated_data["tenant_id"] = tenant_id
        validated_data["owner"] = request.user
        return super().create(validated_data)

    def update(self, instance, validated_data):
        # Track completion timestamp
        if "completed" in validated_data:
            from django.utils import timezone
            if validated_data["completed"] and not instance.completed:
                validated_data["completed_at"] = timezone.now()
            elif not validated_data["completed"] and instance.completed:
                validated_data["completed_at"] = None
        return super().update(instance, validated_data)
