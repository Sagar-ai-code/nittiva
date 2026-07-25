"""
Attachment model for tasks and projects.

This module contains Attachment model for file attachments.
"""
import uuid
from django.db import models
from django.conf import settings


class Attachment(models.Model):
    """Attachment model for tasks and projects."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Multi-tenant
    tenant_id = models.UUIDField(null=True, blank=True, db_index=True, help_text="Tenant this attachment belongs to")
    
    # Generic foreign key
    content_type = models.CharField(max_length=20)  # "task" or "project"
    object_id = models.UUIDField()
    
    # File details
    file_name = models.CharField(max_length=255)
    file_size = models.PositiveIntegerField(help_text="File size in bytes")
    file_type = models.CharField(max_length=100, help_text="MIME type")
    file_url = models.URLField(help_text="S3 URL or storage path")
    
    # Uploader
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="uploaded_attachments"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = "attachments"
        indexes = [
            models.Index(fields=["tenant_id", "content_type", "object_id"]),
            models.Index(fields=["tenant_id", "uploaded_by"]),
        ]
        ordering = ["-created_at"]
    
    def __str__(self):
        return f"{self.file_name} on {self.content_type}:{self.object_id}"
