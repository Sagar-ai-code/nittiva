"""Tests for the email status endpoints (A-2, Arjun's task)."""
import pytest
from rest_framework import status

pytestmark = pytest.mark.django_db


def test_email_status_returns_config_false_when_console(auth_client, tenant):
    """With no EMAIL_HOST_USER/PASSWORD set, the backend uses console
    and configured should be False."""
    r = auth_client.get("/api/system/email_status/")
    assert r.status_code == status.HTTP_200_OK, r.content
    body = r.json()
    data = body.get("data", body)
    assert data["backend"] in ("smtp", "console")
    # The test env doesn't set SMTP creds, so configured is False.
    assert data["configured"] is False
    assert data["backend"] == "console"
    assert "from_email" in data


def test_email_status_no_secrets_in_response(auth_client, tenant):
    """The response must not leak the EMAIL_HOST_PASSWORD."""
    r = auth_client.get("/api/system/email_status/")
    body = r.json()
    # Serialize to a string and look for any password-like field
    text = str(body).lower()
    assert "password" not in text
    # And the secret env var shouldn't appear
    assert "secret" not in text or "secret_key" in text  # secret_key is the django SECRET_KEY, not email


def test_email_status_test_sends_to_caller(auth_client, tenant):
    """POST /api/system/email_status/test/ without a 'to' field should
    send to the caller's email. With console backend, this just logs
    and returns sent=True."""
    r = auth_client.post("/api/system/email_status/test/", data={}, format="json")
    assert r.status_code == status.HTTP_200_OK, r.content
    body = r.json()
    data = body.get("data", body)
    # console backend will return sent=True (the email "went" to console)
    assert data["to"] == "admin@test.local"
    assert data["backend"] == "console"


def test_email_status_test_with_explicit_to(auth_client, tenant):
    """POST /api/system/email_status/test/ with a 'to' field sends to
    that address."""
    r = auth_client.post(
        "/api/system/email_status/test/",
        data={"to": "specific@example.com"},
        format="json",
    )
    assert r.status_code == status.HTTP_200_OK, r.content
    data = r.json().get("data", r.json())
    assert data["to"] == "specific@example.com"
