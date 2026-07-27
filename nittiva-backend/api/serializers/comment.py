"""
Comment serializers.

This module contains serializers for comment data.
"""
from rest_framework import serializers
from ..models import Comment
from .user import UserSerializer


class CommentSerializer(serializers.ModelSerializer):
    """Serializer for comments."""

    author = UserSerializer(read_only=True)
    replies = serializers.SerializerMethodField()
    replies_count = serializers.SerializerMethodField()
    _debug_sync = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = [
            "id",
            "content_type",
            "object_id",
            "content",
            "author",
            "parent",
            "replies",
            "replies_count",
            "_debug_sync",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "author", "created_at", "updated_at", "_debug_sync"]

    def get_replies(self, obj):
        """Get nested replies."""
        replies = obj.replies.all().order_by("created_at")
        return CommentSerializer(replies, many=True).data

    def get_replies_count(self, obj):
        """Get count of replies."""
        return obj.replies.count()

    def get__debug_sync(self, obj):
        """Surface the auto-subscribe / mention-sync result so we can
        debug the @mention flow end-to-end from the API response.
        Returns None on the read path; populated only on a fresh create."""
        return {
            "subscribers_added": getattr(obj, "_sync_subscribers_added", None),
            "error": getattr(obj, "_sync_error", None),
        } if (hasattr(obj, "_sync_subscribers_added") or hasattr(obj, "_sync_error")) else None

    def create(self, validated_data):
        request = self.context.get("request")
        tenant_id = getattr(request, 'tenant_id', None)

        if not tenant_id:
            raise serializers.ValidationError({"tenant": "Tenant not found."})

        validated_data["tenant_id"] = tenant_id
        validated_data["author"] = request.user

        return super().create(validated_data)
