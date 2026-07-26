"""
Note model.

A Note is a free-form piece of text attached to either a Task or a Project
(mirrors the Comment model's content_type/object_id generic-fk pattern).
"""
import uuid
from django.db import models
from django.conf import settings


class Note(models.Model):
    """Note attached to a task or project."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Multi-tenant
    tenant_id = models.UUIDField(
        null=True, blank=True, db_index=True,
        help_text="Tenant this note belongs to",
    )

    # Generic attachment target: ("task" or "project") + uuid
    content_type = models.CharField(max_length=20)  # "task" | "project"
    object_id = models.UUIDField()

    # Content
    title = models.CharField(max_length=255, blank=True, default="")
    content = models.TextField()

    # Author
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="notes",
    )

    # UX helpers
    is_pinned = models.BooleanField(default=False)
    color = models.CharField(max_length=20, blank=True, default="")  # hex or token

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "notes"
        indexes = [
            models.Index(fields=["tenant_id", "content_type", "object_id"]),
            models.Index(fields=["tenant_id", "author"]),
        ]
        ordering = ["-is_pinned", "-updated_at"]

    def __str__(self):
        target = f"{self.content_type}:{self.object_id}"
        title = self.title or (self.content[:30] + "…" if len(self.content) > 30 else self.content)
        return f"Note({title!r} on {target})"
