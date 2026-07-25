"""
Time log model for tracking time on tasks.

This module contains TimeLog model for time tracking.
"""
import uuid
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator


class TimeLog(models.Model):
    """Time log entry for tasks."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Multi-tenant
    tenant_id = models.UUIDField(null=True, blank=True, db_index=True, help_text="Tenant this time log belongs to")
    
    task = models.ForeignKey(
        "Task",
        on_delete=models.CASCADE,
        related_name="time_logs",
        null=True,
        blank=True,
        help_text="Optional task this time log is associated with"
    )
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="time_logs"
    )
    
    # Time tracking
    started_at = models.DateTimeField()
    ended_at = models.DateTimeField(null=True, blank=True)
    duration_seconds = models.PositiveIntegerField(
        default=0,
        validators=[MinValueValidator(0)],
        help_text="Duration in seconds"
    )
    
    # Manual entry
    is_manual = models.BooleanField(default=False, help_text="True if manually entered, False if from timer")
    description = models.TextField(blank=True, null=True, help_text="Description of work done")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = "time_logs"
        indexes = [
            models.Index(fields=["tenant_id", "task"]),
            models.Index(fields=["tenant_id", "user"]),
            models.Index(fields=["tenant_id", "started_at"]),
        ]
        ordering = ["-started_at"]
    
    def __str__(self):
        hours = self.duration_seconds // 3600
        minutes = (self.duration_seconds % 3600) // 60
        task_name = self.task.title if self.task else "General work"
        return f"{hours}h {minutes}m on {task_name}"
    
    def save(self, *args, **kwargs):
        """Calculate duration if ended_at is set."""
        if self.ended_at and self.started_at:
            delta = self.ended_at - self.started_at
            self.duration_seconds = int(delta.total_seconds())
        super().save(*args, **kwargs)
