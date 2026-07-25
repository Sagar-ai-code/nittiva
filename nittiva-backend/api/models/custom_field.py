"""
Custom Field model.

This module contains the CustomField model for managing custom columns/fields in task lists.
"""

import uuid
from django.db import models


class CustomField(models.Model):
    """Custom field model for managing dynamic columns in task lists."""
    
    class FieldType(models.TextChoices):
        TEXT = "text", "Text"
        NUMBER = "number", "Number"
        MONEY = "money", "Money"
        DATE = "date", "Date"
        DROPDOWN = "dropdown", "Dropdown"
        RATING = "rating", "Rating"
        CHECKBOX = "checkbox", "Checkbox"
    
    # Multi-tenant: Each custom field belongs to a tenant
    tenant_id = models.UUIDField(null=True, blank=True, db_index=True, help_text="Tenant this field belongs to")
    
    def _generate_id():
        return f"field-{uuid.uuid4().hex[:8]}"
    
    id = models.CharField(max_length=100, primary_key=True, default=_generate_id)
    name = models.CharField(max_length=200, help_text="Field name/label")
    field_type = models.CharField(max_length=20, choices=FieldType.choices, default=FieldType.TEXT)
    width = models.PositiveIntegerField(default=150, help_text="Column width in pixels")
    
    # For dropdown fields
    options = models.JSONField(default=list, blank=True, help_text="Options for dropdown fields")
    
    # Ordering
    order = models.PositiveIntegerField(default=0, help_text="Display order")
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = "custom_fields"
        indexes = [
            models.Index(fields=["tenant_id", "order"]),
            models.Index(fields=["tenant_id", "field_type"]),
        ]
        ordering = ["order", "name"]
    
    def __str__(self):
        return f"{self.name} ({self.field_type})"
