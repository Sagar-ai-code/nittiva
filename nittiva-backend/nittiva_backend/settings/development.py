"""
Development settings for Nittiva Backend.

This module contains settings specific to the development environment.
"""

from .base import *

# -------------------------------------------------------------------
# Core
# -------------------------------------------------------------------
DEBUG = True

# -------------------------------------------------------------------
# Security
# -------------------------------------------------------------------
# Local dev over HTTP
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False
# Default SameSite ('Lax') works fine for local API calls

# -------------------------------------------------------------------
# Email Configuration (Development)
# -------------------------------------------------------------------
# Use console backend for development (emails print to console)
EMAIL_BACKEND = os.getenv("EMAIL_BACKEND", "django.core.mail.backends.console.EmailBackend")
EMAIL_HOST = os.getenv("EMAIL_HOST", "localhost")
EMAIL_PORT = int(os.getenv("EMAIL_PORT", "587"))
EMAIL_USE_TLS = env_bool("EMAIL_USE_TLS", True)
EMAIL_HOST_USER = os.getenv("EMAIL_HOST_USER", "")
EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD", "")
DEFAULT_FROM_EMAIL = os.getenv("DEFAULT_FROM_EMAIL", "noreply@nittiva.com")
