"""Smoke + CRUD tests for the Note, Todo, and Meeting viewsets (Round 3)."""
import pytest
from rest_framework import status

from api.models import Note, Todo, Meeting


pytestmark = pytest.mark.django_db


# ----- Note -----

def test_note_list(auth_client):
    r = auth_client.get("/api/notes/")
    assert r.status_code == status.HTTP_200_OK, r.content
    assert "results" in r.json() or isinstance(r.json(), list)


def test_note_crud(auth_client, admin_user):
    create = auth_client.post(
        "/api/notes/",
        data={
            "content_type": "task",
            "object_id": "00000000-0000-0000-0000-000000000001",
            "title": "Smoke test note",
            "content": "Hello @admin",
        },
        format="json",
    )
    assert create.status_code == status.HTTP_201_CREATED, create.content
    note = create.json()
    note_id = note["id"]
    # Response shape: UUID id, bigint author, content_type
    assert isinstance(note_id, str) and len(note_id) == 36
    assert note["content_type"] == "task"

    r = auth_client.get(f"/api/notes/{note_id}/")
    assert r.status_code == status.HTTP_200_OK
    assert r.json()["title"] == "Smoke test note"

    r = auth_client.delete(f"/api/notes/{note_id}/")
    assert r.status_code == status.HTTP_204_NO_CONTENT
    assert not Note.objects.filter(id=note_id).exists()


# ----- Todo -----

def test_todo_list(auth_client):
    r = auth_client.get("/api/todos/")
    assert r.status_code == status.HTTP_200_OK, r.content


def test_todo_crud(auth_client, admin_user):
    create = auth_client.post(
        "/api/todos/",
        data={
            "title": "Smoke todo",
            "description": "Do the thing",
            "priority": "medium",
            "owner": admin_user.id,
        },
        format="json",
    )
    assert create.status_code == status.HTTP_201_CREATED, create.content
    todo = create.json()
    todo_id = todo["id"]
    assert isinstance(todo_id, str) and len(todo_id) == 36

    # Toggle complete
    r = auth_client.patch(f"/api/todos/{todo_id}/", data={"completed": True}, format="json")
    assert r.status_code == status.HTTP_200_OK
    assert r.json()["completed"] is True

    r = auth_client.delete(f"/api/todos/{todo_id}/")
    assert r.status_code == status.HTTP_204_NO_CONTENT
    assert not Todo.objects.filter(id=todo_id).exists()


# ----- Meeting -----

def test_meeting_list(auth_client):
    r = auth_client.get("/api/meetings/")
    assert r.status_code == status.HTTP_200_OK, r.content


def test_meeting_crud(auth_client, admin_user):
    create = auth_client.post(
        "/api/meetings/",
        data={
            "title": "Smoke meeting",
            "start_time": "2026-08-01T10:00:00Z",
            "end_time": "2026-08-01T11:00:00Z",
            "organizer": admin_user.id,
            "status": "scheduled",
        },
        format="json",
    )
    assert create.status_code == status.HTTP_201_CREATED, create.content
    meeting = create.json()
    meeting_id = meeting["id"]
    assert isinstance(meeting_id, str) and len(meeting_id) == 36

    r = auth_client.delete(f"/api/meetings/{meeting_id}/")
    assert r.status_code == status.HTTP_204_NO_CONTENT
    assert not Meeting.objects.filter(id=meeting_id).exists()
