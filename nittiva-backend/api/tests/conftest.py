"""
Pytest fixtures for the Nittiva test suite.

Goals:
- Each test gets a fresh Tenant + admin User (no shared state between tests).
- The middleware sees request.tenant / request.tenant_id so the viewsets work.
- APIClient is pre-authed with a JWT for convenience.
- A second user is created for @mention tests.

Run with: pytest -q
"""
import os
import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

# Ensure tests use the dev DB before Django settings load.
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "nittiva_backend.settings.development")
os.environ.setdefault("SECRET_KEY", "test-secret-key-for-pytest-only")

from api.models import Tenant  # noqa: E402  (import after env)

User = get_user_model()


@pytest.fixture
def tenant(db):
    """Create a fresh Tenant for each test."""
    import uuid
    unique = uuid.uuid4().hex[:8].upper()
    return Tenant.objects.create(
        company_id=f"TEST-{unique}",
        name="Test Tenant",
        subdomain=f"test-{unique.lower()}",
        is_active=True,
        is_trial=True,
    )


@pytest.fixture
def admin_user(db, tenant):
    """A superuser admin tied to the test tenant."""
    user = User.objects.create_user(
        email="admin@test.local",
        password="TestPass123!",
        name="Admin",
        tenant_id=tenant.id,
        is_staff=True,
        is_superuser=True,
        is_active=True,
    )
    return user


@pytest.fixture
def other_user(db, tenant):
    """A second user (for @mention tests)."""
    user = User.objects.create_user(
        email="other@test.local",
        password="TestPass123!",
        name="Other User",
        tenant_id=tenant.id,
        is_active=True,
    )
    return user


@pytest.fixture
def api_client(db, admin_user, tenant):
    """A DRF APIClient pre-authed with a JWT for the admin user.

    The tenant_id is attached to every request so the tenant middleware
    resolves it without needing the X-Company-ID header.

    Note: Nittiva's URLs are mounted at /api/, so the test client points
    its requests there via SERVER_NAME + wsgi.url_scheme.
    """
    refresh = RefreshToken.for_user(admin_user)
    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")
    # Auto-attach X-Company-ID to every request so the tenant middleware
    # resolves the tenant from the header. This avoids having to add it
    # to every call.
    original_get = client.get
    original_post = client.post
    original_patch = client.patch
    original_delete = client.delete

    def with_tenant(method):
        def wrapped(*args, **kwargs):
            kwargs.setdefault("HTTP_X_COMPANY_ID", tenant.company_id)
            return method(*args, **kwargs)
        return wrapped

    client.get = with_tenant(original_get)
    client.post = with_tenant(original_post)
    client.patch = with_tenant(original_patch)
    client.delete = with_tenant(original_delete)
    return client


@pytest.fixture
def auth_client(api_client, admin_user, tenant):
    """Alias for api_client (semantic name when the test only needs auth)."""
    return api_client
