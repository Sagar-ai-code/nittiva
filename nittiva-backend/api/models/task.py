"""
Task models.

This module contains Task and TaskAssignment models for managing tasks and assignments.
"""

from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models
from django.db.models import UniqueConstraint


class Task(models.Model):
    """Task model for managing tasks within projects - supports multiple work item types."""

    class WorkItemType(models.TextChoices):
        EPIC = "epic", "Epic"
        STORY = "story", "Story"
        TASK = "task", "Task"
        BUG = "bug", "Bug"
        REQUEST = "request", "Request"

    class Status(models.TextChoices):
        TODO = "to-do", "To Do"
        IN_PROGRESS = "in-progress", "In Progress"
        COMPLETED = "completed", "Completed"
        REVIEW = "review", "Review"

    class Priority(models.TextChoices):
        LOW = "low", "Low"
        MEDIUM = "medium", "Medium"
        HIGH = "high", "High"

    # Multi-tenant: Each task belongs to a tenant
    tenant_id = models.UUIDField(null=True, blank=True, db_index=True, help_text="Tenant this task belongs to")
    
    # Work item type
    work_item_type = models.CharField(
        max_length=20,
        choices=WorkItemType.choices,
        default=WorkItemType.TASK,
        help_text="Type of work item (Epic, Story, Task, Bug, Request)"
    )
    
    # Parent-child hierarchy
    parent = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="children",
        help_text="Parent task (for subtasks)"
    )
    
    project = models.ForeignKey(
        "Project",
        on_delete=models.CASCADE,
        related_name="tasks",
        null=True,
        blank=True,
    )

    sprint = models.ForeignKey(
        "Sprint",
        on_delete=models.SET_NULL,
        related_name="tasks",
        null=True,
        blank=True,
        help_text="Sprint this task belongs to",
    )

    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)

    # Legacy status/priority fields (for backward compatibility)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.TODO)
    priority = models.CharField(max_length=10, choices=Priority.choices, default=Priority.MEDIUM)
    
    # Custom status/priority (optional - if set, these take precedence)
    custom_status = models.ForeignKey(
        "TaskStatus",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="tasks",
        help_text="Custom status (overrides status field if set)"
    )
    custom_priority = models.ForeignKey(
        "TaskPriority",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="tasks",
        help_text="Custom priority (overrides priority field if set)"
    )
    
    due_date = models.DateField(blank=True, null=True)
    
    # Story points (for Epics/Stories)
    story_points = models.PositiveIntegerField(null=True, blank=True, help_text="Story points for estimation")

    progress = models.PositiveSmallIntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
    )  # 0..100
    time_tracked_seconds = models.PositiveIntegerField(default=0)

    # many assignees
    assignees = models.ManyToManyField(
        settings.AUTH_USER_MODEL, through="TaskAssignment", related_name="tasks"
    )

    # flexible table fields (Status/Budget/Rating etc.)
    custom_fields = models.JSONField(default=dict, blank=True)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="created_tasks"
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="updated_tasks"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "tasks"
        indexes = [
            models.Index(fields=["tenant_id", "project"]),
            models.Index(fields=["tenant_id", "status"]),
            models.Index(fields=["tenant_id", "work_item_type"]),
            models.Index(fields=["tenant_id", "parent"]),
            models.Index(fields=["tenant_id", "due_date"]),
            models.Index(fields=["tenant_id", "sprint"]),
            models.Index(fields=["sprint", "status"]),
            models.Index(fields=["tenant_id", "custom_status"]),
            models.Index(fields=["tenant_id", "custom_priority"]),
        ]

    def __str__(self):
        return f"[{self.work_item_type.upper()}] {self.title}"
    
    def calculate_progress_from_children(self):
        """Calculate progress from child tasks."""
        children = self.children.filter(tenant_id=self.tenant_id)
        if children.exists():
            total_progress = sum(child.progress for child in children)
            self.progress = total_progress // children.count()
            self.save(update_fields=["progress"])
        return self.progress


class TaskAssignment(models.Model):
    """Task assignment model for managing task assignments to users."""

    # Multi-tenant: Each task assignment belongs to a tenant
    tenant_id = models.UUIDField(null=True, blank=True, db_index=True, help_text="Tenant this assignment belongs to")
    
    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name="assignments"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="task_assignments"
    )
    assigned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "task_assignments"
        indexes = [
            models.Index(fields=["tenant_id", "task"]),
            models.Index(fields=["tenant_id", "user"]),
        ]
        constraints = [
            UniqueConstraint(fields=["task", "user"], name="uniq_task_user"),
        ]

