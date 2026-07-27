"""Tests for the @mention / TaskSubscriber system (Round 6).

These cover the most important new behavior:
- UserViewSet.search returns tenant-scoped matches
- POST /comments/ with @username creates a CommentMention row
- The author and the @-mentioned user become TaskSubscribers
- The mentioned user (not the actor) gets a Notification
"""
import pytest
from rest_framework import status

from api.models import (
    Task, Comment, Note,
    CommentMention, NoteMention, TaskSubscriber, Notification,
)


pytestmark = pytest.mark.django_db


def test_user_search_returns_tenant_scoped_results(auth_client, other_user):
    """The /users/search/ endpoint is the @mention autocomplete backend."""
    r = auth_client.get("/api/users/search/?q=other&limit=10")
    assert r.status_code == status.HTTP_200_OK, r.content
    body = r.json()
    # Response shape: { results: [{id, name, email, role, photo_url}] }
    results = body.get("results", body) if isinstance(body, dict) else body
    assert any(u["email"] == "other@test.local" for u in results), body


def test_user_search_excludes_inactive_users(auth_client, other_user, tenant):
    """is_active=False users don't show up in autocomplete."""
    other_user.is_active = False
    other_user.save()
    r = auth_client.get("/api/users/search/?q=other")
    assert r.status_code == status.HTTP_200_OK
    results = r.json().get("results", r.json()) if isinstance(r.json(), dict) else r.json()
    assert not any(u["email"] == "other@test.local" for u in results)


def test_comment_with_mention_creates_comment_mention_and_subscribers(
    auth_client, other_user, admin_user, tenant
):
    """@-mentioning someone in a comment on a task should:
       1. Persist a CommentMention row
       2. Auto-subscribe the author + the mentioned user to the task
       3. Fire a Notification for the mentioned user (not the actor)
    """
    # Set up: need a real task to comment on
    task = Task.objects.create(
        title="Mention smoke task",
        work_item_type="task",
        tenant_id=tenant.id,
        project=None,
    )
    # Post a comment that @-mentions other_user (by first name "Other")
    r = auth_client.post(
        "/api/comments/",
        data={
            "content_type": "task",
            "object_id": str(task.id),
            "content": f"@other please review this task",
        },
        format="json",
    )
    assert r.status_code == status.HTTP_201_CREATED, r.content
    comment = r.json()
    comment_id = comment["id"]

    # 1. CommentMention row exists
    mention = CommentMention.objects.filter(comment_id=comment_id, mentioned_user=other_user).first()
    assert mention is not None, "CommentMention row not created"

    # 2. TaskSubscriber rows: author (admin) and mentioned (other) are both added
    subs = TaskSubscriber.objects.filter(task=task).values_list("user_id", flat=True)
    assert admin_user.id in subs, f"Author not auto-subscribed: subs={list(subs)}"
    assert other_user.id in subs, f"Mentioned user not auto-subscribed: subs={list(subs)}"

    # 3. Notification fired for the mentioned user (not the actor)
    notif = Notification.objects.filter(
        recipient=other_user,
        title__icontains="mentioned",
    ).first()
    assert notif is not None, "No notification for the mentioned user"
    # The author should NOT get a notification about their own mention
    admin_notif = Notification.objects.filter(
        recipient=admin_user,
        title__icontains="mentioned",
    ).first()
    assert admin_notif is None, "Author got a notification about their own mention"


def test_explicit_subscribe_endpoint(auth_client, other_user, tenant):
    """POST /task-subscribers/ subscribes the current user to a task."""
    task = Task.objects.create(
        title="Explicit subscribe task",
        work_item_type="task",
        tenant_id=tenant.id,
        project=None,
    )
    r = auth_client.post(
        "/api/task-subscribers/",
        data={"task": task.id},
        format="json",
    )
    assert r.status_code == status.HTTP_201_CREATED, r.content
    sub = r.json()
    sub_id = sub["id"]

    # Should appear in the task's subscribers list
    r = auth_client.get(f"/api/task-subscribers/?task={task.id}")
    assert r.status_code == status.HTTP_200_OK
    body = r.json()
    results = body.get("results", body) if isinstance(body, dict) else body
    assert any(s["id"] == sub_id for s in results), body

    # Cleanup
    r = auth_client.delete(f"/api/task-subscribers/{sub_id}/")
    assert r.status_code == status.HTTP_204_NO_CONTENT
    assert not TaskSubscriber.objects.filter(id=sub_id).exists()
