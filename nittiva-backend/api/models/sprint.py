"""
Sprint models.

This module contains Sprint and SprintMember models for managing sprints and team assignments.
"""

from django.conf import settings
from django.db import models
from django.db.models import UniqueConstraint


class Sprint(models.Model):
    """Sprint model for managing sprints within projects."""

    class Status(models.TextChoices):
        PLANNING = "planning", "Planning"
        ACTIVE = "active", "Active"
        COMPLETED = "completed", "Completed"
        CANCELLED = "cancelled", "Cancelled"

    # Multi-tenant: Each sprint belongs to a tenant
    tenant_id = models.UUIDField(
        null=True, blank=True, db_index=True, help_text="Tenant this sprint belongs to"
    )

    project = models.ForeignKey(
        "Project",
        on_delete=models.CASCADE,
        related_name="sprints",
        help_text="Project this sprint belongs to",
    )

    name = models.CharField(max_length=200, help_text="Sprint name (e.g., Sprint 1)")
    goal = models.TextField(blank=True, null=True, help_text="Sprint goal/objective")
    description = models.TextField(blank=True, null=True, help_text="Detailed sprint description")

    start_date = models.DateField(help_text="Sprint start date")
    end_date = models.DateField(help_text="Sprint end date")

    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.PLANNING, help_text="Current sprint status"
    )

    # Velocity and planning
    velocity_target = models.PositiveIntegerField(
        null=True, blank=True, help_text="Target story points for this sprint"
    )
    actual_velocity = models.PositiveIntegerField(
        null=True, blank=True, help_text="Actual story points completed"
    )

    # Retrospective
    retrospective_notes = models.TextField(
        blank=True, null=True, help_text="Sprint retrospective notes"
    )
    what_went_well = models.TextField(blank=True, null=True, help_text="What went well in this sprint")
    what_to_improve = models.TextField(blank=True, null=True, help_text="What to improve next sprint")
    action_items = models.TextField(blank=True, null=True, help_text="Action items from retrospective")

    # Metadata
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_sprints",
        help_text="User who created this sprint",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "sprints"
        indexes = [
            models.Index(fields=["tenant_id", "project"]),
            models.Index(fields=["tenant_id", "status"]),
            models.Index(fields=["tenant_id", "start_date", "end_date"]),
            models.Index(fields=["project", "status"]),
        ]
        ordering = ["-start_date", "-created_at"]

    def __str__(self):
        return f"{self.name} - {self.project.name if self.project else 'No Project'}"

    @property
    def duration_days(self):
        """Calculate sprint duration in days."""
        if self.start_date and self.end_date:
            return (self.end_date - self.start_date).days + 1
        return 0

    def calculate_velocity(self):
        """Calculate actual velocity from completed tasks."""
        from .task import Task

        sprint_tasks = Task.objects.filter(
            tenant_id=self.tenant_id,
            sprint=self,
            status=Task.Status.COMPLETED,
        )
        total_story_points = sum(task.story_points or 0 for task in sprint_tasks)
        self.actual_velocity = total_story_points
        self.save(update_fields=["actual_velocity"])
        return total_story_points


class SprintMember(models.Model):
    """Sprint membership model for managing sprint team members."""

    class Role(models.TextChoices):
        SCRUM_MASTER = "scrum_master", "Scrum Master"
        PRODUCT_OWNER = "product_owner", "Product Owner"
        DEVELOPER = "developer", "Developer"
        MEMBER = "member", "Member"

    # Multi-tenant: Each sprint member belongs to a tenant
    tenant_id = models.UUIDField(
        null=True, blank=True, db_index=True, help_text="Tenant this membership belongs to"
    )

    sprint = models.ForeignKey(
        Sprint, on_delete=models.CASCADE, related_name="memberships", help_text="Sprint this member belongs to"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="sprint_memberships",
        help_text="User who is a member of this sprint",
    )
    role = models.CharField(
        max_length=20, choices=Role.choices, default=Role.MEMBER, help_text="Role in the sprint"
    )
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "sprint_members"
        indexes = [
            models.Index(fields=["tenant_id", "sprint"]),
            models.Index(fields=["tenant_id", "user"]),
        ]
        constraints = [
            UniqueConstraint(fields=["sprint", "user"], name="uniq_sprint_user"),
        ]

    def __str__(self):
        return f"{self.user.email} - {self.sprint.name} ({self.role})"
