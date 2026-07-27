"""Tests for the TaskHistory / activity log (V-1, Vikram's task).

These cover the most important new behavior:
- Creating a task writes a 'created' history row
- Updating a tracked field writes an 'updated' row with a structured diff
- Adding/removing an assignee writes 'assigned'/'unassigned' rows + a Notification
- The /api/tasks/<id>/history/ endpoint returns the rows
- Posting a comment on a task writes a 'commented' row
"""
import pytest
from rest_framework import status

from api.models import (
    Task, TaskHistory, Notification,
)


pytestmark = pytest.mark.django_db


# -----------------------------------------------------------------
# Task.save() → TaskHistory row
# -----------------------------------------------------------------

def test_task_create_writes_history_row(auth_client, tenant):
    """Creating a task should write a 'created' history row with the
    non-empty tracked fields in the diff.
    """
    r = auth_client.post(
        "/api/tasks/",
        data={
            "title": "Ship V-1",
            "description": "Add the activity log",
            "status": "to-do",
            "priority": "high",
        },
        format="json",
    )
    assert r.status_code == status.HTTP_201_CREATED, r.content
    task_id = r.json()["id"]

    rows = TaskHistory.objects.filter(task_id=task_id)
    assert rows.count() == 1
    row = rows.first()
    assert row.verb == "created"
    assert row.diff["title"][1] == "Ship V-1"
    assert row.diff["status"][1] == "to-do"
    assert row.diff["priority"][1] == "high"
    assert row.actor_id is not None  # the admin who created it


def test_task_update_writes_diff_history_row(auth_client, tenant, other_user):
    """Changing a tracked field should write an 'updated' row with the diff
    showing the old → new values.
    """
    # Create the task
    r = auth_client.post(
        "/api/tasks/",
        data={"title": "V-1 task", "status": "to-do", "priority": "medium"},
        format="json",
    )
    assert r.status_code == status.HTTP_201_CREATED, r.content
    task_id = r.json()["id"]

    # Update the status + priority
    r = auth_client.patch(
        f"/api/tasks/{task_id}/",
        data={"status": "in-progress", "priority": "high"},
        format="json",
    )
    assert r.status_code == status.HTTP_200_OK, r.content

    rows = list(TaskHistory.objects.filter(task_id=task_id, verb="updated"))
    assert len(rows) == 1
    row = rows[0]
    assert row.diff["status"] == ["to-do", "in-progress"]
    assert row.diff["priority"] == ["medium", "high"]
    # Title didn't change → not in diff
    assert "title" not in row.diff


def test_task_no_op_save_does_not_write_history(auth_client, tenant):
    """Saving without changes should NOT write a history row."""
    r = auth_client.post(
        "/api/tasks/",
        data={"title": "Quiet task"},
        format="json",
    )
    assert r.status_code == status.HTTP_201_CREATED, r.content
    task_id = r.json()["id"]
    initial_count = TaskHistory.objects.filter(task_id=task_id).count()
    assert initial_count == 1  # just the 'created' row

    # PATCH with no real change
    r = auth_client.patch(
        f"/api/tasks/{task_id}/",
        data={"title": "Quiet task"},
        format="json",
    )
    assert r.status_code == status.HTTP_200_OK, r.content
    assert TaskHistory.objects.filter(task_id=task_id).count() == 1


# -----------------------------------------------------------------
# Assignee change → 'assigned' / 'unassigned' rows + Notification
# -----------------------------------------------------------------

def test_assigning_user_writes_history_and_notification(
    auth_client, tenant, other_user
):
    """Adding a new assignee should write a TaskHistory 'assigned' row
    AND a Notification for the new assignee.
    """
    # Create a task with no assignees
    r = auth_client.post(
        "/api/tasks/",
        data={"title": "Assign me"},
        format="json",
    )
    assert r.status_code == status.HTTP_201_CREATED, r.content
    task_id = r.json()["id"]

    # Add other_user as an assignee
    r = auth_client.patch(
        f"/api/tasks/{task_id}/",
        data={"assignee_ids": [other_user.id]},
        format="json",
    )
    assert r.status_code == status.HTTP_200_OK, r.content

    rows = list(TaskHistory.objects.filter(task_id=task_id, verb="assigned"))
    assert len(rows) == 1
    assert rows[0].diff["user_id"] == other_user.id
    assert rows[0].diff["user_email"] == other_user.email

    notifs = Notification.objects.filter(recipient=other_user, title__contains="assigned")
    assert notifs.count() == 1
    assert str(task_id) in notifs.first().link


def test_unassigning_user_writes_history_no_notification(
    auth_client, tenant, other_user
):
    """Removing an assignee should write a TaskHistory 'unassigned' row
    but should NOT fire a Notification (no need to bother the ex-assignee).
    """
    # Create with other_user assigned
    r = auth_client.post(
        "/api/tasks/",
        data={"title": "Unassign me", "assignee_ids": [other_user.id]},
        format="json",
    )
    assert r.status_code == status.HTTP_201_CREATED, r.content
    task_id = r.json()["id"]

    # Clear the assignees
    r = auth_client.patch(
        f"/api/tasks/{task_id}/",
        data={"assignee_ids": []},
        format="json",
    )
    assert r.status_code == status.HTTP_200_OK, r.content

    rows = TaskHistory.objects.filter(task_id=task_id, verb="unassigned")
    assert rows.count() == 1
    assert rows.first().diff["user_id"] == other_user.id
    # The 'assigned' notification is still there from the create, but no NEW one
    new_notifs = Notification.objects.filter(
        recipient=other_user, title__contains="unassigned"
    )
    assert new_notifs.count() == 0


# -----------------------------------------------------------------
# GET /api/tasks/<id>/history/ endpoint
# -----------------------------------------------------------------

def test_history_endpoint_returns_rows_newest_first(auth_client, tenant, other_user):
    """The /history/ endpoint should return rows newest-first with the
    actor and verb visible.
    """
    r = auth_client.post(
        "/api/tasks/",
        data={"title": "History endpoint test"},
        format="json",
    )
    assert r.status_code == status.HTTP_201_CREATED, r.content
    task_id = r.json()["id"]

    # Make a couple of changes
    auth_client.patch(
        f"/api/tasks/{task_id}/",
        data={"status": "in-progress", "assignee_ids": [other_user.id]},
        format="json",
    )

    r = auth_client.get(f"/api/tasks/{task_id}/history/")
    assert r.status_code == status.HTTP_200_OK, r.content
    rows = r.json()
    # Newest first: assigned (most recent), then updated, then created
    assert len(rows) == 3
    assert rows[0]["verb"] == "assigned"
    assert rows[1]["verb"] == "updated"
    assert rows[2]["verb"] == "created"
    # Actor is expanded
    assert rows[0]["actor"]["email"] == "admin@test.local"
    # Diff is a dict
    assert isinstance(rows[0]["diff"], dict)
    assert rows[0]["diff"]["user_id"] == other_user.id


def test_history_endpoint_404_for_missing_task(auth_client, tenant):
    r = auth_client.get("/api/tasks/999999/history/")
    assert r.status_code == status.HTTP_404_NOT_FOUND


# -----------------------------------------------------------------
# Comment on a task → 'commented' history row
# -----------------------------------------------------------------

def test_comment_on_task_writes_commented_history_row(auth_client, tenant):
    """Posting a comment with content_type='task' on a task should write
    a TaskHistory 'commented' row with the comment preview in the diff.
    """
    # Create a task
    r = auth_client.post(
        "/api/tasks/",
        data={"title": "Comment me"},
        format="json",
    )
    assert r.status_code == status.HTTP_201_CREATED, r.content
    task_id = r.json()["id"]

    # Post a comment on the task
    r = auth_client.post(
        "/api/comments/",
        data={
            "content_type": "task",
            "object_id": str(task_id),
            "content": "Looks good!",
        },
        format="json",
    )
    assert r.status_code == status.HTTP_201_CREATED, r.content
    comment_id = r.json()["id"]

    rows = TaskHistory.objects.filter(task_id=task_id, verb="commented")
    assert rows.count() == 1
    assert rows.first().diff["comment_id"] == str(comment_id)
    assert rows.first().diff["preview"] == "Looks good!"


# -----------------------------------------------------------------
# GET /api/time-logs/active_timers/ — manager visibility
# -----------------------------------------------------------------

def test_active_timers_endpoint_returns_running_timers(auth_client, tenant, other_user):
    """Manager (admin) can see all active timers in the tenant.

    Sets up a running timer for other_user (via direct ORM) and asserts
    the admin sees it via the endpoint.
    """
    from api.models import TimeLog, Task
    from django.utils import timezone

    task = Task.objects.create(title="Live task", tenant_id=tenant.id, work_item_type="task")
    TimeLog.objects.create(
        tenant_id=tenant.id,
        user=other_user,
        task=task,
        started_at=timezone.now(),
        is_manual=False,
    )

    r = auth_client.get("/api/time-logs/active_timers/")
    assert r.status_code == status.HTTP_200_OK, r.content
    body = r.json()
    rows = body.get("data", body) if isinstance(body, dict) else body
    assert isinstance(rows, list) and len(rows) == 1
    assert rows[0]["user"]["email"] == other_user.email
    assert rows[0]["task"]["id"] == task.id
    assert rows[0]["task"]["title"] == "Live task"
    assert rows[0]["duration_seconds"] >= 0
