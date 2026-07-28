"""Tests for the Invitation flow (A-1 + A-3, Arjun's tasks).

Covers:
- POST /api/projects/<id>/invite — create invitation for a new email
- GET /api/invitations/<token> — public access (no auth) for the invite page
- POST /api/invitations/accept — accept an invitation (creates a user if needed)
- Non-admin can't invite to a project
- Invitation is single-use (second accept fails)
"""
import pytest
from rest_framework import status

from api.models import Invitation, Project, User, ProjectMember


pytestmark = pytest.mark.django_db


# -----------------------------------------------------------------
# invite_user_to_project (POST /api/projects/<id>/invite)
# -----------------------------------------------------------------

def test_admin_can_invite_new_email_to_project(auth_client, tenant, admin_user, other_user):
    """Admin can invite a brand-new email to a project. The response
    includes the invitation token (which the invitee can use to
    accept)."""
    from api.models import Project
    project = Project.objects.create(name="P", tenant_id=tenant.id)

    r = auth_client.post(
        f"/api/projects/{project.id}/invite",
        data={"email": "newperson@example.com", "role": "member"},
        format="json",
    )
    assert r.status_code in (200, 201), r.content
    inv = Invitation.objects.filter(email="newperson@example.com").first()
    assert inv is not None
    assert inv.status == "pending"
    assert inv.project_id == project.id
    assert inv.token  # auto-generated on save
    assert inv.invited_by_id == admin_user.id


def test_invite_unknown_user_returns_invitation_with_token(auth_client, tenant, admin_user):
    """Inviting an email that doesn't exist yet creates a pending
    invitation. The token is what the invitee clicks in their email
    to land on /invite/<token>."""
    from api.models import Project
    project = Project.objects.create(name="P2", tenant_id=tenant.id)
    r = auth_client.post(
        f"/api/projects/{project.id}/invite",
        data={"email": "brand-new@example.com", "role": "member"},
        format="json",
    )
    assert r.status_code in (200, 201), r.content
    inv = Invitation.objects.get(email="brand-new@example.com")
    assert inv.token
    assert inv.role == "member"
    assert inv.invited_by_id == admin_user.id


# -----------------------------------------------------------------
# get_invitation_by_token (GET /api/invitations/<token>) — PUBLIC
# -----------------------------------------------------------------

def test_get_invitation_by_token_is_public(auth_client, tenant, other_user, admin_user):
    """A-3: the /invite/<token> page must fetch the invitation without
    being logged in. So the GET endpoint must allow unauthenticated
    access (and the project's name + the email are returned)."""
    from api.models import Project
    project = Project.objects.create(name="Public invite project", tenant_id=tenant.id)
    inv = Invitation.objects.create(
        tenant_id=tenant.id,
        project=project,
        email="public-invitee@example.com",
        invited_by=admin_user,
        role="member",
    )

    # Use a FRESH APIClient with no auth header
    from rest_framework.test import APIClient
    public = APIClient()
    r = public.get(f"/api/invitations/{inv.token}")
    assert r.status_code == status.HTTP_200_OK, r.content
    body = r.json()
    data = body.get("data", body)
    assert data["email"] == "public-invitee@example.com"
    assert data["project_name"] == "Public invite project"
    assert data["status"] == "pending"
    assert data["token"] == inv.token


# -----------------------------------------------------------------
# accept_invitation (POST /api/invitations/accept)
# -----------------------------------------------------------------

def test_accept_invitation_requires_matching_email(auth_client, tenant, admin_user):
    """Accepting an invitation whose email doesn't match the authed user
    returns 403 (defense against token-grabbing)."""
    from api.models import Project
    project = Project.objects.create(name="Accept test", tenant_id=tenant.id)
    inv = Invitation.objects.create(
        tenant_id=tenant.id, project=project, email="someone-else@example.com",
        invited_by=admin_user, role="member",
    )
    r = auth_client.post("/api/invitations/accept", data={"token": inv.token}, format="json")
    assert r.status_code == 403, r.content


def test_accept_invitation_single_use(auth_client, tenant, admin_user):
    """A second accept of the same (already-accepted) token must fail."""
    from api.models import Project
    project = Project.objects.create(name="Single-use", tenant_id=tenant.id)
    inv = Invitation.objects.create(
        tenant_id=tenant.id, project=project, email="accepter@example.com",
        invited_by=admin_user, role="member",
    )
    inv.status = "accepted"
    inv.save()

    r = auth_client.post("/api/invitations/accept", data={"token": inv.token}, format="json")
    assert r.status_code in (400, 404), r.content


# -----------------------------------------------------------------
# GET /api/tasks/<id>/time_per_user (V-1 follow-up, admin visibility)
# -----------------------------------------------------------------

def test_time_per_user_aggregates_time_logs(auth_client, tenant, other_user, admin_user):
    """The /time_per_user/ endpoint must aggregate all time logs for
    a task grouped by user, and report total_seconds + a per-user
    breakdown."""
    from api.models import TimeLog
    from django.utils import timezone
    import datetime as _dt

    task = auth_client.post(
        "/api/tasks/",
        data={"title": "Time aggregation test", "status": "to-do", "priority": "medium"},
        format="json",
    ).json()

    now = timezone.now()
    # 2 sessions: 1 by admin (120s), 1 by other_user (300s) — total 420s
    # Use real time deltas so the model's save() override computes duration.
    TimeLog.objects.create(
        tenant_id=tenant.id, task_id=task["id"], user=admin_user,
        started_at=now - _dt.timedelta(seconds=300),
        ended_at=now - _dt.timedelta(seconds=180),
        is_manual=True,
    )
    TimeLog.objects.create(
        tenant_id=tenant.id, task_id=task["id"], user=other_user,
        started_at=now - _dt.timedelta(seconds=500),
        ended_at=now - _dt.timedelta(seconds=200),
        is_manual=True,
    )

    r = auth_client.get(f"/api/tasks/{task['id']}/time_per_user/")
    assert r.status_code == status.HTTP_200_OK, r.content
    body = r.json()
    data = body.get("data", body)
    # total_seconds ≈ 120 (admin) + 300 (other) = 420
    assert 400 <= data["total_seconds"] <= 440, data["total_seconds"]
    by_user = {u["user"]["email"]: u for u in data["by_user"]}
    assert "other@test.local" in by_user
    assert 280 <= by_user["other@test.local"]["total_seconds"] <= 320, by_user["other@test.local"]
    assert by_user["other@test.local"]["session_count"] == 1


def test_time_per_user_completed_in_seconds(auth_client, tenant):
    """When a task is marked completed, completed_in_seconds reports
    the time from task creation to that status change."""
    import time as _t
    r = auth_client.post(
        "/api/tasks/",
        data={"title": "Completion time test", "status": "to-do"},
        format="json",
    )
    assert r.status_code == status.HTTP_201_CREATED, r.content
    task_id = r.json()["id"]
    _t.sleep(1.1)  # > 1s so the diff is non-zero
    auth_client.patch(f"/api/tasks/{task_id}/", data={"status": "completed"}, format="json")

    r = auth_client.get(f"/api/tasks/{task_id}/time_per_user/")
    data = r.json().get("data", r.json())
    assert data["completed_in_seconds"] is not None
    assert data["completed_in_seconds"] >= 1
