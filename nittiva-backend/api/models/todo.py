"""
Todo model.

Per-user checklist items, optionally linked to a project.
"""
import uuid
from django.db import models
from django.conf import settings


class Todo(models.Model):
    """Todo item for a user, optionally attached to a project."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Multi-tenant
    tenant_id = models.UUIDField(
        null=True, blank=True, db_index=True,
        help_text="Tenant this todo belongs to",
    )

    # Content
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")

    # State
    completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)

    # Ownership / assignment
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="owned_todos",
    )
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="assigned_todos",
    )

    # Optional project link (still UUID for forward-compat with the Project model)
    project_id = models.UUIDField(null=True, blank=True, db_index=True)

    # Scheduling
    due_date = models.DateTimeField(null=True, blank=True)
    priority = models.CharField(
        max_length=10,
        choices=[("low", "Low"), ("medium", "Medium"), ("high", "High")],
        default="medium",
    )

    # Ordering (within a list view)
    position = models.IntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "todos"
        indexes = [
            models.Index(fields=["tenant_id", "owner"]),
            models.Index(fields=["tenant_id", "completed"]),
        ]
        ordering = ["completed", "position", "-updated_at"]

    def __str__(self):
        return f"Todo({self.title!r}, done={self.completed})"
