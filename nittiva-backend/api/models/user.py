"""
User model and manager.

This module contains the custom User model and UserManager for authentication.
"""

from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.db import models
from django.core.exceptions import ValidationError


class UserManager(BaseUserManager):
    """Custom user manager for email-based authentication."""

    def create_user(self, email, password=None, **extra_fields):
        """Create and save a regular user."""
        if not email:
            raise ValueError("Users must have an email")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        """Create and save a superuser."""
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("role", "admin")
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """Custom user model using email as the username."""

    # Multi-tenant: Each user belongs to a tenant
    tenant_id = models.UUIDField(null=True, blank=True, db_index=True, help_text="Tenant this user belongs to")
    
    # Email must be unique (Django requirement for USERNAME_FIELD)
    # Per-tenant uniqueness is enforced by UniqueConstraint below
    email = models.EmailField(unique=True)
    name = models.CharField(max_length=120, blank=True)
    role = models.CharField(max_length=30, default="user")
    
    # Google OAuth fields
    google_id = models.CharField(max_length=255, unique=True, null=True, blank=True)
    profile_image_url = models.URLField(blank=True, null=True)
    auth_provider = models.CharField(max_length=20, default="email")  # 'email' or 'google'

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = "users"
        indexes = [
            models.Index(fields=["tenant_id", "email"]),
            models.Index(fields=["tenant_id", "is_active"]),
        ]
        # Email should be unique per tenant, not globally
        constraints = [
            models.UniqueConstraint(fields=["tenant_id", "email"], name="unique_tenant_email"),
        ]

    objects = UserManager()
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["name"]

    def __str__(self):
        return self.email

