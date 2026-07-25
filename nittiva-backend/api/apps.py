"""
Django app configuration for API.

This module contains the app configuration for the API application.
"""

from django.apps import AppConfig


class ApiConfig(AppConfig):
    """Configuration for the API app."""

    default_auto_field = "django.db.models.BigAutoField"
    name = "api"