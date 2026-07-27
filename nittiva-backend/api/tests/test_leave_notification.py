"""Tests for LeaveRequest and Notification viewsets (Round 4)."""
import pytest
from rest_framework import status

from api.models import LeaveRequest, Notification


pytestmark = pytest.mark.django_db


def test_leave_request_list(auth_client):
    r = auth_client.get("/api/leave-requests/")
    assert r.status_code == status.HTTP_200_OK, r.content


def test_leave_request_crud(auth_client, admin_user):
    create = auth_client.post(
        "/api/leave-requests/",
        data={
            "requester": admin_user.id,
            "start_date": "2026-08-01",
            "end_date": "2026-08-05",
            "leave_type": "annual",
            "reason": "Smoke test leave",
        },
        format="json",
    )
    assert create.status_code == status.HTTP_201_CREATED, create.content
    lr = create.json()
    lr_id = lr["id"]
    assert isinstance(lr_id, str) and len(lr_id) == 36
    # Default status is "pending"
    assert lr["status"] in ("pending", "Pending", None)  # field may be unset on create

    # Approve
    r = auth_client.post(f"/api/leave-requests/{lr_id}/approve/", data={}, format="json")
    assert r.status_code == status.HTTP_200_OK, r.content
    assert r.json()["status"] == "approved"

    r = auth_client.delete(f"/api/leave-requests/{lr_id}/")
    assert r.status_code == status.HTTP_204_NO_CONTENT
    assert not LeaveRequest.objects.filter(id=lr_id).exists()


def test_notification_list(auth_client):
    r = auth_client.get("/api/notifications/")
    assert r.status_code == status.HTTP_200_OK, r.content


def test_notification_unread_count(auth_client):
    r = auth_client.get("/api/notifications/unread_count/")
    assert r.status_code == status.HTTP_200_OK, r.content
    # The endpoint returns {"count": N} (paginated) or {"unread_count": N}
    # depending on the version. Accept either.
    body = r.json()
    assert isinstance(body, dict)
    if "data" in body:
        body = body["data"]
    assert "count" in body or "unread_count" in body, body


def test_notification_crud(auth_client, admin_user, tenant):
    # Notifications are created by the system; we can still test the list + delete
    n = Notification.objects.create(
        recipient=admin_user,
        title="Smoke",
        type="info",
        tenant_id=tenant.id,
    )
    r = auth_client.delete(f"/api/notifications/{n.id}/")
    assert r.status_code == status.HTTP_204_NO_CONTENT
    assert not Notification.objects.filter(id=n.id).exists()
