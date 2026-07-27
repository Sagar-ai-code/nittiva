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

    # Generic attachment target. We use CharField (not UUIDField) because
    # Task uses BigAutoField while Project uses UUIDField. The proper fix is
    # to migrate to Django's `contenttypes` framework; for now we accept
    # either type as a string. See migration 0017.
    content_type = models.CharField(max_length=20, help_text='"task" or "project"')
    object_id = models.CharField(
        max_length=64,
        help_text="ID (UUID or int) of the task or project this note is attached to",
    )

    # Content
    title = models.CharField(max_length=255, blank=True, default="")
    content = models.TextField()

    # Author
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="notes",
        help_text="User who wrote the note",
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


class NoteMention(models.Model):
    """Records that a user was @-mentioned in a Note's content.

    Populated by the mention parser when a Note is saved. Each row is one
    (note, mentioned_user) pair. Patterned after Plane's IssueMention.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    tenant_id = models.UUIDField(null=True, blank=True, db_index=True)

    note = models.ForeignKey(
        Note,
        on_delete=models.CASCADE,
        related_name="mentions",
    )
    mentioned_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="note_mentions",
    )

    # Who added the mention (usually == note.author)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="note_mentions_created",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "note_mentions"
        constraints = [
            models.UniqueConstraint(
                fields=["note", "mentioned_user"],
                name="uniq_note_mentioned_user",
            ),
        ]
        indexes = [
            models.Index(fields=["tenant_id", "mentioned_user"]),
        ]

    def __str__(self):
        return f"Mention of {self.mentioned_user_id} in note {self.note_id}"

