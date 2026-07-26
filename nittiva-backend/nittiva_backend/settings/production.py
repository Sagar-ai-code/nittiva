"""
Production settings for Nittiva Backend.

This module contains settings specific to the production environment.
"""

import os

from .base import *

# -------------------------------------------------------------------
# Core
# -------------------------------------------------------------------
DEBUG = False

# -------------------------------------------------------------------
# Middleware
# -------------------------------------------------------------------
# Insert WhiteNoise right after SecurityMiddleware in prod
MIDDLEWARE.insert(2, "whitenoise.middleware.WhiteNoiseMiddleware")

# -------------------------------------------------------------------
# Static files
# -------------------------------------------------------------------
# WhiteNoise storage only in production
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

# -------------------------------------------------------------------
# Security
# -------------------------------------------------------------------
# Cookies: secure & samesite only in production
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SESSION_COOKIE_SAMESITE = "None"
CSRF_COOKIE_SAMESITE = "None"

# -------------------------------------------------------------------
# Email Configuration (Production)
# -------------------------------------------------------------------
# If SMTP credentials are set, use real SMTP delivery. Otherwise fall back
# to the console backend so the app doesn't crash, and emails get printed
# to the Render logs (still better than silently dropping).
DEFAULT_FROM_EMAIL = os.getenv("DEFAULT_FROM_EMAIL", "noreply@nittiva.com")

if os.getenv("EMAIL_HOST_USER") and os.getenv("EMAIL_HOST_PASSWORD"):
    EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
    EMAIL_HOST = os.getenv("EMAIL_HOST", "smtp.gmail.com")
    EMAIL_PORT = int(os.getenv("EMAIL_PORT", "587"))
    EMAIL_USE_TLS = os.getenv("EMAIL_USE_TLS", "True").lower() in {"1", "true", "yes"}
    EMAIL_HOST_USER = os.getenv("EMAIL_HOST_USER")
    EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD")
else:
    # No SMTP creds → log to console. Set EMAIL_HOST_USER and EMAIL_HOST_PASSWORD
    # in Render env vars to enable real email delivery (password reset, invites).
    EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

