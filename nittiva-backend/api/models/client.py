"""
Client model.

This module contains the Client model for managing client information.
"""

from django.conf import settings
from django.db import models


class Client(models.Model):
    """Client model for managing client information."""

    # Multi-tenant: Each client belongs to a tenant
    tenant_id = models.UUIDField(null=True, blank=True, db_index=True, help_text="Tenant this client belongs to")
    
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="clients",
        null=True,
        blank=True,
    )
    name = models.CharField(max_length=120)
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=40, blank=True, null=True)
    company = models.CharField(max_length=120, blank=True, null=True)
    status = models.BooleanField(default=True)  # active/inactive

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "clients"
        indexes = [
            models.Index(fields=["tenant_id", "owner"]),
            models.Index(fields=["tenant_id", "name"]),
        ]

    def __str__(self):
        return self.name

