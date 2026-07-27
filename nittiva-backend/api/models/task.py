"""
Task models.

This module contains Task and TaskAssignment models for managing tasks and assignments.
"""

import uuid

from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models
from django.db.models import UniqueConstraint


# Fields we want to track in TaskHistory. Anything not in this set is ignored.
TRACKED_TASK_FIELDS = (
    "title",
    "description",
    "status",
    "priority",
    "progress",
    "due_date",
    "story_points",
    "work_item_type",
    "parent_id",
    "project_id",
    "sprint_id",
    "custom_status_id",
    "custom_priority_id",
)


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

    def save(self, *args, **kwargs):
        """Override save() to write a TaskHistory row on every field change.

        Patterned after Plane's IssueActivity. Detects changes by comparing
        the in-memory instance to the row already in the DB (when updating).

        Assignee changes are handled separately in `record_assignee_changes`
        because assignees are M2M, not a regular field, and we also want to
        fire a Notification for the new assignee.
        """
        is_create = self.pk is None or not Task.objects.filter(pk=self.pk).exists()
        old_values = None
        if not is_create:
            try:
                old = Task.objects.get(pk=self.pk)
                old_values = {f: getattr(old, f) for f in TRACKED_TASK_FIELDS}
            except Task.DoesNotExist:
                is_create = True

        super().save(*args, **kwargs)

        # Build the diff (only for tracked fields that actually changed)
        diff = {}
        if is_create:
            verb = "created"
            for f in TRACKED_TASK_FIELDS:
                v = getattr(self, f, None)
                if v not in (None, "", [], {}):
                    diff[f] = [None, v]
        else:
            for f in TRACKED_TASK_FIELDS:
                old_v = old_values.get(f)
                new_v = getattr(self, f, None)
                if old_v != new_v:
                    diff[f] = [
                        None if old_v == "" else old_v,
                        None if new_v == "" else new_v,
                    ]
            verb = "updated" if diff else None

        if not diff:
            return

        # Determine the actor from the audit field set by the view (updated_by)
        actor = getattr(self, "updated_by", None) or getattr(self, "created_by", None)

        TaskHistory.objects.create(
            tenant_id=self.tenant_id,
            task=self,
            actor=actor,
            verb=verb,
            diff=diff,
        )


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


class TaskSubscriber(models.Model):
    """A user who is watching a task — gets notifications about changes.

    Populated when:
      - A user is @-mentioned in a note or comment on the task
      - A user creates a note or comment on the task (the author)
      - A user is added explicitly via the API

    Patterned after Plane's IssueSubscriber. Subscribers are NOT assignees
    — they receive notifications, but the work isn't owned by them.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    tenant_id = models.UUIDField(null=True, blank=True, db_index=True)

    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name="subscribers",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="task_subscriptions",
    )

    # Optional: who added this subscription (the mention parser, the author themselves, or a manager)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="task_subscriptions_created",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "task_subscribers"
        constraints = [
            UniqueConstraint(fields=["task", "user"], name="uniq_task_subscriber"),
        ]
        indexes = [
            models.Index(fields=["tenant_id", "task"]),
            models.Index(fields=["tenant_id", "user"]),
        ]

    def __str__(self):
        return f"{self.user_id} watches {self.task_id}"


class TaskHistory(models.Model):
    """A row in the activity log for a task.

    Written by `Task.save()` (and a couple of explicit helper methods) every
    time a tracked field changes, an assignee is added/removed, or a
    comment / note is posted on the task. The frontend's right sidebar reads
    `GET /api/tasks/<id>/history/` to render the activity feed.

    Patterned after Plane's IssueActivity. The `verb` is a coarse label;
    the `diff` JSONField holds the actual structured change so the UI can
    render things like "Sagar changed status from 'to-do' to 'in-progress'".

    Assignee changes go through a separate `verb` ('assigned' /
    'unassigned') and also fire a Notification for the new assignee.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    tenant_id = models.UUIDField(null=True, blank=True, db_index=True)

    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name="history",
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="task_history_actions",
    )

    # Coarse verb
    VERB_CHOICES = [
        ("created", "Created"),
        ("updated", "Updated"),
        ("assigned", "Assigned"),
        ("unassigned", "Unassigned"),
        ("commented", "Commented"),
        ("noted", "Noted"),
    ]
    verb = models.CharField(max_length=20, choices=VERB_CHOICES, default="updated")

    # Structured diff: {"status": ["to-do", "in-progress"]} for updates,
    # or {"user_id": 5, "user_email": "..."} for assigns, or
    # {"comment_id": "...", "preview": "first 80 chars"} for comments.
    diff = models.JSONField(default=dict, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "task_history"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["tenant_id", "task", "-created_at"]),
        ]

    def __str__(self):
        return f"TaskHistory({self.task_id} {self.verb} by {self.actor_id})"

    @classmethod
    def record_assignee_change(cls, *, task, actor, user, action):
        """Helper called from the task viewset when an assignee is added/removed.

        Writes a TaskHistory row AND a Notification for the new assignee.
        `action` is 'assigned' or 'unassigned'.
        """
        # Lazy import to avoid circular import
        from .notification import Notification

        cls.objects.create(
            tenant_id=task.tenant_id,
            task=task,
            actor=actor,
            verb=action,
            diff={
                "user_id": user.id,
                "user_email": getattr(user, "email", ""),
                "user_name": (
                    f"{getattr(user, 'first_name', '')} {getattr(user, 'last_name', '')}".strip()
                    or getattr(user, "email", "")
                ),
            },
        )

        if action == "assigned" and user.id != (getattr(actor, "id", None)):
            Notification.objects.create(
                tenant_id=task.tenant_id,
                recipient=user,
                type="info",
                title=f"You were assigned to '{task.title}'",
                message=f"{getattr(actor, 'email', 'Someone')} assigned you to this task.",
                link=f"/dashboard/tasks/{task.id}",
            )

    @classmethod
    def record_comment(cls, *, task, actor, comment):
        """Helper called from the comment viewset when a comment is posted on a task."""
        preview = (comment.content or "")[:80]
        cls.objects.create(
            tenant_id=task.tenant_id,
            task=task,
            actor=actor,
            verb="commented",
            diff={
                "comment_id": str(comment.id),
                "preview": preview,
            },
        )


