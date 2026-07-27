"""
Meeting model.

Calendar-style meeting with participants. Optionally linked to a project.
"""
import uuid
from django.db import models
from django.conf import settings


class Meeting(models.Model):
    """Scheduled meeting with a start/end time and a set of participants."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Multi-tenant
    tenant_id = models.UUIDField(
        null=True, blank=True, db_index=True,
        help_text="Tenant this meeting belongs to",
    )

    # Content
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")
    location = models.CharField(max_length=255, blank=True, default="")
    meeting_url = models.URLField(blank=True, default="")

    # Time
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()

    # Organizer + participants
    organizer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="organized_meetings",
        help_text="User who organized the meeting",
    )
    participants = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        blank=True,
        related_name="meetings",
        help_text="Users invited to the meeting",
    )

    # Optional project link
    project_id = models.UUIDField(null=True, blank=True, db_index=True)

    # Status
    STATUS_CHOICES = [
        ("scheduled", "Scheduled"),
        ("in_progress", "In Progress"),
        ("completed", "Completed"),
        ("cancelled", "Cancelled"),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="scheduled")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "meetings"
        indexes = [
            models.Index(fields=["tenant_id", "start_time"]),
            models.Index(fields=["tenant_id", "status"]),
        ]
        ordering = ["start_time"]

    def __str__(self):
        return f"Meeting({self.title!r} @ {self.start_time})"
