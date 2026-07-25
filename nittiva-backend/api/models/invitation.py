"""
Invitation model for project invitations.

This module contains the Invitation model for managing project invitations.
"""

import uuid
from django.conf import settings
from django.db import models
from django.utils import timezone
from datetime import timedelta


class Invitation(models.Model):
    """
    Invitation model for inviting users to projects.
    
    Invitations can be sent to:
    - Existing users (by email)
    - New users (by email, they'll register first)
    """
    
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        ACCEPTED = "accepted", "Accepted"
        REJECTED = "rejected", "Rejected"
        EXPIRED = "expired", "Expired"
    
    class Role(models.TextChoices):
        ADMIN = "admin", "Admin"
        MEMBER = "member", "Member"
        VIEWER = "viewer", "Viewer"
    
    # Multi-tenant: Each invitation belongs to a tenant
    tenant_id = models.UUIDField(null=False, db_index=True, help_text="Tenant this invitation belongs to")
    
    # Invitation details
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    token = models.CharField(max_length=64, unique=True, db_index=True, help_text="Unique invitation token")
    
    # Project and user
    project = models.ForeignKey(
        "Project",
        on_delete=models.CASCADE,
        related_name="invitations"
    )
    email = models.EmailField(help_text="Email address of invited user")
    invited_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="sent_invitations",
        help_text="User who sent the invitation"
    )
    invited_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="received_invitations",
        help_text="User who received the invitation (if already registered)"
    )
    
    # Role and status
    role = models.CharField(max_length=10, choices=Role.choices, default=Role.MEMBER, help_text="Role to assign when accepted")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    
    # Expiration
    expires_at = models.DateTimeField(help_text="When the invitation expires")
    accepted_at = models.DateTimeField(null=True, blank=True)
    
    # Metadata
    message = models.TextField(blank=True, null=True, help_text="Optional message from inviter")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = "invitations"
        indexes = [
            models.Index(fields=["tenant_id", "email"]),
            models.Index(fields=["tenant_id", "status"]),
            models.Index(fields=["token"]),
            models.Index(fields=["project", "email"]),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["project", "email", "status"],
                condition=models.Q(status="pending"),
                name="unique_pending_invitation"
            ),
        ]
        ordering = ["-created_at"]
    
    def __str__(self):
        return f"Invitation for {self.email} to {self.project.name}"
    
    def save(self, *args, **kwargs):
        """Set expiration date if not set."""
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(days=7)  # 7 days expiration
        if not self.token:
            self.token = uuid.uuid4().hex
        super().save(*args, **kwargs)
    
    def is_expired(self):
        """Check if invitation has expired."""
        return timezone.now() > self.expires_at
    
    def can_be_accepted(self):
        """Check if invitation can be accepted."""
        return self.status == self.Status.PENDING and not self.is_expired()
    
    def accept(self, user=None):
        """Accept the invitation."""
        if not self.can_be_accepted():
            raise ValueError("Invitation cannot be accepted")
        
        self.status = self.Status.ACCEPTED
        self.accepted_at = timezone.now()
        if user:
            self.invited_user = user
        self.save()
        
        # Create ProjectMember
        from .project import ProjectMember
        ProjectMember.objects.get_or_create(
            project=self.project,
            user=user or self.invited_user,
            defaults={
                "role": self.role,
                "tenant_id": self.tenant_id
            }
        )
