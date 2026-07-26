"""
Chat serializers.
"""
from rest_framework import serializers
from ..models import ChatRoom, ChatMessage
from .user import UserSerializer


class ChatMessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)

    class Meta:
        model = ChatMessage
        fields = ["id", "room", "sender", "content", "created_at", "updated_at"]
        read_only_fields = ["id", "sender", "created_at", "updated_at"]

    def create(self, validated_data):
        request = self.context.get("request")
        tenant_id = getattr(request, "tenant_id", None)
        if not tenant_id:
            raise serializers.ValidationError({"tenant": "Tenant not found."})
        validated_data["tenant_id"] = tenant_id
        validated_data["sender"] = request.user
        msg = super().create(validated_data)
        # Bump the room's updated_at so it sorts to the top
        room = validated_data["room"]
        room.save(update_fields=["updated_at"])
        return msg


class ChatRoomSerializer(serializers.ModelSerializer):
    participants = UserSerializer(many=True, read_only=True)
    participant_ids = serializers.ListField(
        child=serializers.UUIDField(),
        write_only=True,
        required=False,
        default=list,
    )
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = ChatRoom
        fields = [
            "id",
            "name",
            "is_group",
            "created_by",
            "participants",
            "participant_ids",
            "last_message",
            "unread_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_by", "created_at", "updated_at"]

    def get_last_message(self, obj):
        last = obj.messages.order_by("-created_at").first()
        if not last:
            return None
        return ChatMessageSerializer(last).data

    def get_unread_count(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return 0
        from django.utils import timezone
        membership = obj.memberships.filter(user=request.user).first()
        if not membership or not membership.last_read_at:
            return obj.messages.count()
        return obj.messages.filter(created_at__gt=membership.last_read_at).count()

    def create(self, validated_data):
        participant_ids = validated_data.pop("participant_ids", [])
        request = self.context.get("request")
        tenant_id = getattr(request, "tenant_id", None)
        if not tenant_id:
            raise serializers.ValidationError({"tenant": "Tenant not found."})
        validated_data["tenant_id"] = tenant_id
        validated_data["created_by"] = request.user
        # DMs default to non-group; named rooms default to group
        name = (validated_data.get("name") or "").strip()
        validated_data["is_group"] = validated_data.get("is_group", bool(name))
        room = super().create(validated_data)
        # Always include the creator
        participant_ids = list(set(participant_ids + [str(request.user.id)]))
        room.participants.set(participant_ids)
        return room

    def update(self, instance, validated_data):
        participant_ids = validated_data.pop("participant_ids", None)
        room = super().update(instance, validated_data)
        if participant_ids is not None:
            room.participants.set(participant_ids)
        return room
