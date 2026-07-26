"""
Chat views.
"""
from django.utils import timezone
from rest_framework import viewsets, permissions
from rest_framework.exceptions import ValidationError, PermissionDenied
from rest_framework.decorators import action
from rest_framework.response import Response

from ..models import ChatRoom, ChatMessage, ChatRoomMembership
from ..serializers import ChatRoomSerializer, ChatMessageSerializer
from ..utils.tenant import get_current_tenant_id


class ChatRoomViewSet(viewsets.ModelViewSet):
    """ViewSet for chat rooms. Auto-scopes to rooms the current user participates in."""

    serializer_class = ChatRoomSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        tenant_id = get_current_tenant_id(self.request)
        if not tenant_id:
            raise ValidationError("Tenant not found.")
        return (
            ChatRoom.objects.filter(tenant_id=tenant_id, participants=self.request.user)
            .distinct()
            .order_by("-updated_at")
        )

    def perform_create(self, serializer):
        tenant_id = get_current_tenant_id(self.request)
        if not tenant_id:
            raise ValidationError("Tenant not found.")
        serializer.save(tenant_id=tenant_id)

    @action(detail=True, methods=["get"])
    def messages(self, request, pk=None):
        """List all messages in this room. Marks them as read for the caller."""
        room = self.get_object()
        qs = room.messages.order_by("created_at")
        # Mark as read
        ChatRoomMembership.objects.filter(room=room, user=request.user).update(last_read_at=timezone.now())
        return Response(ChatMessageSerializer(qs, many=True).data)

    @action(detail=True, methods=["post"], url_path="send")
    def send(self, request, pk=None):
        """Send a message into this room. Body: { "content": "..." }."""
        room = self.get_object()
        content = (request.data.get("content") or "").strip()
        if not content:
            return Response({"detail": "content is required"}, status=400)
        msg = ChatMessage.objects.create(
            tenant_id=room.tenant_id,
            room=room,
            sender=request.user,
            content=content,
        )
        room.save(update_fields=["updated_at"])
        return Response(ChatMessageSerializer(msg).data, status=201)

    @action(detail=True, methods=["post"], url_path="mark_read")
    def mark_read(self, request, pk=None):
        """Mark all messages in this room as read for the caller."""
        room = self.get_object()
        ChatRoomMembership.objects.filter(room=room, user=request.user).update(last_read_at=timezone.now())
        return Response({"detail": "ok"})


class ChatMessageViewSet(viewsets.ModelViewSet):
    """ViewSet for individual messages. Filter by `?room=<id>`."""

    serializer_class = ChatMessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        tenant_id = get_current_tenant_id(self.request)
        if not tenant_id:
            raise ValidationError("Tenant not found.")

        qs = ChatMessage.objects.filter(tenant_id=tenant_id, room__participants=self.request.user)

        room_id = self.request.query_params.get("room")
        if room_id:
            qs = qs.filter(room_id=room_id)

        return qs.order_by("created_at")

    def perform_create(self, serializer):
        tenant_id = get_current_tenant_id(self.request)
        if not tenant_id:
            raise ValidationError("Tenant not found.")
        serializer.save(tenant_id=tenant_id)

    def perform_destroy(self, instance):
        # Only the sender (or a manager) can delete a message
        user = self.request.user
        if instance.sender_id != user.id and not (user.is_superuser or user.is_staff):
            raise PermissionDenied("You can only delete your own messages.")
        instance.delete()
