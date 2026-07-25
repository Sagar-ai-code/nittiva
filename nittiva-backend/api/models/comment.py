"""
Comment model for tasks and projects.

This module contains Comment model for adding comments to work items.
"""
import uuid
from django.db import models
from django.conf import settings


class Comment(models.Model):
    """Comment model for tasks and projects."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Multi-tenant
    tenant_id = models.UUIDField(null=True, blank=True, db_index=True, help_text="Tenant this comment belongs to")
    
    # Generic foreign key to task or project
    content_type = models.CharField(max_length=20)  # "task" or "project"
    object_id = models.UUIDField()
    
    # Comment content
    content = models.TextField()
    
    # Author
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="comments"
    )
    
    # Parent comment (for threading)
    parent = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="replies"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = "comments"
        indexes = [
            models.Index(fields=["tenant_id", "content_type", "object_id"]),
            models.Index(fields=["tenant_id", "author"]),
        ]
        ordering = ["-created_at"]
    
    def __str__(self):
        author_name = self.author.name if self.author else "Unknown"
        return f"Comment by {author_name} on {self.content_type}:{self.object_id}"
