"""
Tenant model for multi-tenant support.

This module contains the Tenant model for managing multi-tenant organizations.
"""

import uuid
import secrets
from django.db import models
from django.core.validators import RegexValidator


class Tenant(models.Model):
    """
    Tenant model for multi-tenant architecture.
    
    Each tenant represents an organization/workspace that uses Nittiva.
    Tenants are identified by a unique company_id (e.g., "ACME123").
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Company ID - unique identifier for tenant (required)
    company_id = models.CharField(
        max_length=20,
        unique=True,
        null=True,
        blank=True,
        db_index=True,
        help_text="Unique company identifier (e.g., ACME123). Users need this to register/login."
    )
    
    # Subdomain identifier (optional, for backward compatibility)
    subdomain = models.CharField(
        max_length=63,
        unique=True,
        null=True,
        blank=True,
        validators=[
            RegexValidator(
                regex=r'^[a-z0-9]([a-z0-9\-]{0,61}[a-z0-9])?$',
                message='Subdomain must be lowercase alphanumeric with hyphens, 1-63 characters'
            )
        ],
        help_text="Subdomain identifier (optional, for backward compatibility)"
    )
    
    name = models.CharField(max_length=200, help_text="Organization/company name")
    email = models.EmailField(blank=True, null=True, help_text="Primary contact email")
    
    # Status
    is_active = models.BooleanField(default=True, help_text="Whether the tenant is active")
    is_trial = models.BooleanField(default=False, help_text="Whether tenant is on trial")
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = "tenants"
        indexes = [
            models.Index(fields=["company_id"]),
            models.Index(fields=["subdomain"]),
            models.Index(fields=["is_active"]),
        ]
        ordering = ["name"]
    
    def __str__(self):
        return f"{self.name} ({self.company_id})"
    
    def save(self, *args, **kwargs):
        """Auto-generate company_id if not provided."""
        if not self.company_id:
            # Generate unique company ID: 6-8 alphanumeric characters
            max_attempts = 10
            for _ in range(max_attempts):
                # Generate a random alphanumeric string
                self.company_id = secrets.token_urlsafe(6).upper().replace('-', '').replace('_', '')[:8]
                # Ensure it doesn't exist
                if not Tenant.objects.filter(company_id=self.company_id).exists():
                    break
            else:
                # Fallback: use UUID-based ID
                self.company_id = str(uuid.uuid4())[:8].upper()
        else:
            # Normalize company_id to uppercase
            self.company_id = self.company_id.upper().strip()
        super().save(*args, **kwargs)
    
    @property
    def domain(self):
        """Get full domain for this tenant (if subdomain exists)."""
        if self.subdomain:
            return f"{self.subdomain}.nittiva.com"
        return None
