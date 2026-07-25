"""
Task Status and Priority models.

This module contains TaskStatus and TaskPriority models for managing customizable
statuses and priorities per tenant.
"""

import uuid
from django.db import models
from django.core.validators import RegexValidator


class TaskStatus(models.Model):
    """Custom task status model - allows tenants to define their own statuses."""
    
    # Multi-tenant: Each status belongs to a tenant
    tenant_id = models.UUIDField(null=True, blank=True, db_index=True, help_text="Tenant this status belongs to")
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=50, help_text="Status name (e.g., 'In Review')")
    slug = models.SlugField(max_length=50, help_text="URL-friendly identifier (e.g., 'in-review')")
    color = models.CharField(
        max_length=7,
        default="#8b5cf6",
        validators=[RegexValidator(regex=r'^#[0-9A-Fa-f]{6}$', message="Color must be a valid hex color code")],
        help_text="Hex color code (e.g., #8b5cf6)"
    )
    icon = models.CharField(max_length=50, blank=True, help_text="Icon name (optional)")
    order = models.PositiveIntegerField(default=0, help_text="Display order (lower numbers appear first)")
    is_default = models.BooleanField(default=False, help_text="Use as default status for new tasks")
    is_final = models.BooleanField(default=False, help_text="Final status - tasks can't move from this status")
    description = models.TextField(blank=True, help_text="Status description")
    is_active = models.BooleanField(default=True, help_text="Whether this status is active")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = "task_statuses"
        indexes = [
            models.Index(fields=["tenant_id", "order"]),
            models.Index(fields=["tenant_id", "is_active"]),
            models.Index(fields=["tenant_id", "slug"]),
        ]
        ordering = ["order", "name"]
        constraints = [
            models.UniqueConstraint(fields=["tenant_id", "slug"], name="uniq_tenant_status_slug"),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.tenant_id})"
    
    def save(self, *args, **kwargs):
        # Ensure only one default status per tenant
        if self.is_default and self.tenant_id:
            TaskStatus.objects.filter(tenant_id=self.tenant_id, is_default=True).exclude(pk=self.pk).update(is_default=False)
        super().save(*args, **kwargs)


class TaskPriority(models.Model):
    """Custom task priority model - allows tenants to define their own priorities."""
    
    # Multi-tenant: Each priority belongs to a tenant
    tenant_id = models.UUIDField(null=True, blank=True, db_index=True, help_text="Tenant this priority belongs to")
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=50, help_text="Priority name (e.g., 'Critical')")
    slug = models.SlugField(max_length=50, help_text="URL-friendly identifier (e.g., 'critical')")
    color = models.CharField(
        max_length=7,
        default="#ef4444",
        validators=[RegexValidator(regex=r'^#[0-9A-Fa-f]{6}$', message="Color must be a valid hex color code")],
        help_text="Hex color code (e.g., #ef4444)"
    )
    icon = models.CharField(max_length=50, blank=True, help_text="Icon name (optional)")
    order = models.PositiveIntegerField(default=0, help_text="Display order (lower numbers appear first)")
    weight = models.IntegerField(default=0, help_text="Weight for sorting/filtering (higher = more important)")
    description = models.TextField(blank=True, help_text="Priority description")
    is_active = models.BooleanField(default=True, help_text="Whether this priority is active")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = "task_priorities"
        indexes = [
            models.Index(fields=["tenant_id", "order"]),
            models.Index(fields=["tenant_id", "is_active"]),
            models.Index(fields=["tenant_id", "slug"]),
            models.Index(fields=["tenant_id", "weight"]),
        ]
        ordering = ["order", "weight", "name"]
        constraints = [
            models.UniqueConstraint(fields=["tenant_id", "slug"], name="uniq_tenant_priority_slug"),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.tenant_id})"
