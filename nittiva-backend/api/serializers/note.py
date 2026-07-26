"""
Note serializers.
"""
from rest_framework import serializers
from ..models import Note
from .user import UserSerializer


class NoteSerializer(serializers.ModelSerializer):
    """Serializer for notes."""

    author = UserSerializer(read_only=True)

    class Meta:
        model = Note
        fields = [
            "id",
            "content_type",
            "object_id",
            "title",
            "content",
            "author",
            "is_pinned",
            "color",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "author", "created_at", "updated_at"]

    def create(self, validated_data):
        request = self.context.get("request")
        tenant_id = getattr(request, "tenant_id", None)
        if not tenant_id:
            raise serializers.ValidationError({"tenant": "Tenant not found."})
        validated_data["tenant_id"] = tenant_id
        validated_data["author"] = request.user
        return super().create(validated_data)
