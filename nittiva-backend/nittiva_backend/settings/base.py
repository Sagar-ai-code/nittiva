"""
Base settings for Nittiva Backend.

This module contains shared settings used across all environments.
"""

import os
from pathlib import Path
from datetime import timedelta
from corsheaders.defaults import default_headers

BASE_DIR = Path(__file__).resolve().parent.parent.parent

# -------------------------------------------------------------------
# Helpers
# -------------------------------------------------------------------
def env_bool(name: str, default: bool = False) -> bool:
    """Convert environment variable to boolean."""
    val = os.getenv(name)
    return (str(default) if val is None else val).lower() in {"1", "true", "yes", "y"}

# -------------------------------------------------------------------
# Core
# -------------------------------------------------------------------
SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret")
DEBUG = env_bool("DEBUG", True)

# Google OAuth Settings
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")

# Your public domains / IPs (production)
PROD_DOMAINS = [
    "api.nittiva.com",
    "nittiva.com",
    "www.nittiva.com",
    "172.31.30.71",   # instance private IP (ALB/internal)
    "23.22.100.187",  # instance public IP (direct tests)
    "nittiva-backend.onrender.com",  # Render deployment URL
]

# Local hosts
LOCAL_HOSTS = ["127.0.0.1", "localhost"]

ALLOWED_HOSTS = PROD_DOMAINS + LOCAL_HOSTS

CSRF_TRUSTED_ORIGINS = [
    # Production (HTTPS)
    "https://api.nittiva.com",
    "https://nittiva.com",
    "https://www.nittiva.com",
    "https://nittiva-backend.onrender.com",
    "https://nittiva-frontend.vercel.app",
    # Local dev (HTTP)
    "http://localhost:8080",
    "http://127.0.0.1:8080",
    "http://localhost:8081",  # Vite dev server alternative port
    "http://127.0.0.1:8081",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

# -------------------------------------------------------------------
# Applications
# -------------------------------------------------------------------
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    # Third-party
    "rest_framework",
    "django_filters",
    "drf_spectacular",
    "corsheaders",

    # Local
    "api",
]

# -------------------------------------------------------------------
# Middleware
# -------------------------------------------------------------------
MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",          # must be at the top
    "api.middleware.TenantMiddleware",                # Multi-tenant: resolve tenant from subdomain
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "nittiva_backend.urls"

# -------------------------------------------------------------------
# Templates
# -------------------------------------------------------------------
TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ]
        },
    }
]

WSGI_APPLICATION = "nittiva_backend.wsgi.application"

# -------------------------------------------------------------------
# Database
# -------------------------------------------------------------------
if os.getenv("POSTGRES_HOST"):
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": os.getenv("POSTGRES_DB", "nittiva"),
            "USER": os.getenv("POSTGRES_USER", "nittiva"),
            "PASSWORD": os.getenv("POSTGRES_PASSWORD", "nittiva"),
            "HOST": os.getenv("POSTGRES_HOST", "localhost"),
            "PORT": os.getenv("POSTGRES_PORT", "5432"),
        }
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }

# -------------------------------------------------------------------
# Auth
# -------------------------------------------------------------------
AUTH_USER_MODEL = "api.User"

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# -------------------------------------------------------------------
# I18N
# -------------------------------------------------------------------
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

# -------------------------------------------------------------------
# Static files
# -------------------------------------------------------------------
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# -------------------------------------------------------------------
# DRF
# -------------------------------------------------------------------
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
    "DEFAULT_FILTER_BACKENDS": (
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ),
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 10,
}

SPECTACULAR_SETTINGS = {
    "TITLE": "Nittiva API",
    "DESCRIPTION": "Django DRF backend for Nittiva",
    "VERSION": "1.0.0",
}

SIMPLE_JWT = {
    "AUTH_HEADER_TYPES": ("Bearer",),
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=int(os.getenv("ACCESS_TOKEN_MINUTES", "60"))),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=int(os.getenv("REFRESH_TOKEN_DAYS", "7"))),
}

# -------------------------------------------------------------------
# CORS
# -------------------------------------------------------------------
CORS_ALLOWED_ORIGINS = [
    # Production
    "https://nittiva.com",
    "https://www.nittiva.com",
    "https://api.nittiva.com",
    "https://nittiva-backend.onrender.com",
    "https://nittiva-frontend.vercel.app",
    # Local dev
    "http://localhost:8080",
    "http://127.0.0.1:8080",
    "http://localhost:8081",  # Vite dev server alternative port
    "http://127.0.0.1:8081",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

CORS_ALLOW_CREDENTIALS = False

CORS_ALLOW_HEADERS = list(default_headers) + [
    "X-Tenant-Subdomain",  # For backward compatibility
    "X-Company-ID",  # Primary method for company_id-based multi-tenancy
    "Company-ID",  # Alternative header name
    "authorization",
    "workspace_id",
]

CORS_EXPOSE_HEADERS = ["Authorization", "Content-Type"]

# -------------------------------------------------------------------
# Proxy / Security
# -------------------------------------------------------------------
USE_X_FORWARDED_HOST = True
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

