"""
Notification model.

Per-user notifications (system events, mentions, etc.) with a read/unread state.
"""
import uuid
from django.db import models
from django.conf import settings


class Notification(models.Model):
    """A notification addressed to a single user."""

    NOTIFICATION_TYPES = [
        ("info", "Info"),
        ("success", "Success"),
        ("warning", "Warning"),
        ("error", "Error"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Multi-tenant
    tenant_id = models.UUIDField(null=True, blank=True, db_index=True)

    # Recipient
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
    )

    # Content
    type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES, default="info")
    title = models.CharField(max_length=255)
    message = models.TextField(blank=True, default="")
    link = models.CharField(max_length=512, blank=True, default="")  # app URL or external

    # Read state
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "notifications"
        indexes = [
            models.Index(fields=["tenant_id", "recipient", "is_read"]),
            models.Index(fields=["tenant_id", "recipient", "-created_at"]),
        ]
        ordering = ["-created_at"]

    def __str__(self):
        return f"Notification({self.recipient_id} {self.type} {self.title!r})"
