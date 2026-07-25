"""
Project models.

This module contains Project and ProjectMember models for managing projects and team memberships.
"""

from django.conf import settings
from django.db import models
from django.db.models import UniqueConstraint


class Project(models.Model):
    """Project model for managing projects."""

    class Status(models.TextChoices):
        TODO = "todo", "To Do"
        IN_PROGRESS = "in-progress", "In Progress"
        COMPLETED = "completed", "Completed"
        ARCHIVED = "archived", "Archived"

    # Multi-tenant: Each project belongs to a tenant
    tenant_id = models.UUIDField(null=True, blank=True, db_index=True, help_text="Tenant this project belongs to")
    
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="owned_projects",
        null=True,
        blank=True,
    )
    client = models.ForeignKey(
        "Client",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="projects",
    )

    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    color = models.CharField(max_length=10, default="#8b5cf6")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.TODO)

    # project members (owner will also be added as admin via logic in serializers/views)
    members = models.ManyToManyField(
        settings.AUTH_USER_MODEL, through="ProjectMember", related_name="projects"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "projects"
        indexes = [
            models.Index(fields=["tenant_id", "owner"]),
            models.Index(fields=["tenant_id", "status"]),
            models.Index(fields=["tenant_id", "name"]),
        ]

    def __str__(self):
        return self.name


class ProjectMember(models.Model):
    """Project membership model for managing project team members."""

    class Role(models.TextChoices):
        ADMIN = "admin", "Admin"
        MEMBER = "member", "Member"
        VIEWER = "viewer", "Viewer"

    # Multi-tenant: Each project member belongs to a tenant
    tenant_id = models.UUIDField(null=True, blank=True, db_index=True, help_text="Tenant this membership belongs to")
    
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="project_memberships"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="project_memberships"
    )
    role = models.CharField(max_length=10, choices=Role.choices, default=Role.MEMBER)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "project_members"
        indexes = [
            models.Index(fields=["tenant_id", "project"]),
            models.Index(fields=["tenant_id", "user"]),
        ]
        constraints = [
            UniqueConstraint(fields=["project", "user"], name="uniq_project_user"),
        ]

