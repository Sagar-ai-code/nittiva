"""
Production settings for Nittiva Backend.

This module contains settings specific to the production environment.
"""

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

