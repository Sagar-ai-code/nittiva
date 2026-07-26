"""
Chat models.

ChatRoom = a conversation (1:1 DM or named group/channel)
ChatMessage = a single message in a room
"""
import uuid
from django.db import models
from django.conf import settings


class ChatRoom(models.Model):
    """A chat room — direct message (2 participants) or named channel."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant_id = models.UUIDField(null=True, blank=True, db_index=True)

    name = models.CharField(max_length=200, blank=True, default="")  # empty for DMs
    is_group = models.BooleanField(default=False)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_chat_rooms",
    )
    participants = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        through="ChatRoomMembership",
        related_name="chat_rooms",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "chat_rooms"
        indexes = [
            models.Index(fields=["tenant_id", "-updated_at"]),
        ]
        ordering = ["-updated_at"]

    def __str__(self):
        return self.name or f"DM({self.id})"


class ChatRoomMembership(models.Model):
    """Through model so we can store per-membership state (joined_at, last_read)."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name="memberships")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="chat_memberships")
    joined_at = models.DateTimeField(auto_now_add=True)
    last_read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "chat_room_memberships"
        unique_together = [("room", "user")]
        indexes = [
            models.Index(fields=["user", "-joined_at"]),
        ]


class ChatMessage(models.Model):
    """A single message in a chat room."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant_id = models.UUIDField(null=True, blank=True, db_index=True)

    room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name="messages")
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="chat_messages",
    )
    content = models.TextField()

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "chat_messages"
        indexes = [
            models.Index(fields=["tenant_id", "room", "-created_at"]),
        ]
        ordering = ["created_at"]

    def __str__(self):
        return f"Msg({self.sender_id} in {self.room_id}): {self.content[:30]}"
