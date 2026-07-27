"""Tests for ChatRoom / ChatMessage and Invoice viewsets (Round 5)."""
import pytest
from datetime import date
from decimal import Decimal
from rest_framework import status

from api.models import ChatRoom, ChatMessage, Invoice, InvoiceLineItem


pytestmark = pytest.mark.django_db


# ----- Chat -----

def test_chat_rooms_list(auth_client):
    r = auth_client.get("/api/chat/rooms/")
    assert r.status_code == status.HTTP_200_OK, r.content


def test_chat_room_crud(auth_client, admin_user, other_user):
    create = auth_client.post(
        "/api/chat/rooms/",
        data={
            "name": "Smoke test room",
            "is_group": False,
            "participant_ids": [admin_user.id, other_user.id],
        },
        format="json",
    )
    assert create.status_code == status.HTTP_201_CREATED, create.content
    room = create.json()
    room_id = room["id"]
    assert isinstance(room_id, str) and len(room_id) == 36

    # Send a message
    r = auth_client.post(
        f"/api/chat/rooms/{room_id}/send/",
        data={"content": "Hello @other"},
        format="json",
    )
    assert r.status_code == status.HTTP_201_CREATED, r.content

    # List messages
    r = auth_client.get(f"/api/chat/rooms/{room_id}/messages/")
    assert r.status_code == status.HTTP_200_OK
    msgs = r.json()
    if isinstance(msgs, dict) and "results" in msgs:
        msgs = msgs["results"]
    assert any(m.get("content") == "Hello @other" for m in msgs)

    # Mark as read
    r = auth_client.post(f"/api/chat/rooms/{room_id}/mark_read/", data={}, format="json")
    assert r.status_code in (200, 204)

    # Delete room
    r = auth_client.delete(f"/api/chat/rooms/{room_id}/")
    assert r.status_code == status.HTTP_204_NO_CONTENT
    assert not ChatRoom.objects.filter(id=room_id).exists()


# ----- Invoice -----

def test_invoice_list(auth_client):
    r = auth_client.get("/api/invoices/")
    assert r.status_code == status.HTTP_200_OK, r.content


def test_invoice_auto_number_per_tenant(auth_client, admin_user):
    """Per-tenant invoice numbering: two invoices in the same tenant get
    sequential INV-0001, INV-0002 — and the client can't override."""
    # Invoice 1: no invoice_number sent
    r1 = auth_client.post(
        "/api/invoices/",
        data={
            "issue_date": "2026-08-01",
            "due_date": "2026-08-31",
            "issued_by": admin_user.id,
            "line_items": [
                {"description": "Work 1", "quantity": "1.00", "unit_price": "100.00"},
            ],
        },
        format="json",
    )
    assert r1.status_code == status.HTTP_201_CREATED, r1.content
    inv1 = r1.json()
    assert inv1["invoice_number"] == "INV-0001", f"expected INV-0001, got {inv1['invoice_number']}"

    # Invoice 2: should be INV-0002 (auto-increment)
    r2 = auth_client.post(
        "/api/invoices/",
        data={
            "issue_date": "2026-08-01",
            "due_date": "2026-08-31",
            "issued_by": admin_user.id,
            "line_items": [
                {"description": "Work 2", "quantity": "2.00", "unit_price": "50.00"},
            ],
        },
        format="json",
    )
    assert r2.status_code == status.HTTP_201_CREATED, r2.content
    inv2 = r2.json()
    assert inv2["invoice_number"] == "INV-0002", f"expected INV-0002, got {inv2['invoice_number']}"

    # The total should be server-recomputed from line items
    assert inv2["total"] == "100.00"  # 2 * 50 = 100

    # The client can't override invoice_number (it's read-only)
    r3 = auth_client.post(
        "/api/invoices/",
        data={
            "invoice_number": "CUSTOM-001",
            "issue_date": "2026-08-01",
            "due_date": "2026-08-31",
            "issued_by": admin_user.id,
            "line_items": [
                {"description": "Work 3", "quantity": "1.00", "unit_price": "10.00"},
            ],
        },
        format="json",
    )
    assert r3.status_code == status.HTTP_201_CREATED, r3.content
    inv3 = r3.json()
    # The server should have ignored "CUSTOM-001" and auto-generated INV-0003
    assert inv3["invoice_number"] == "INV-0003", f"expected INV-0003, got {inv3['invoice_number']}"


def test_invoice_delete(auth_client, admin_user):
    r = auth_client.post(
        "/api/invoices/",
        data={
            "issue_date": "2026-08-01",
            "due_date": "2026-08-31",
            "issued_by": admin_user.id,
            "line_items": [{"description": "x", "quantity": "1.00", "unit_price": "1.00"}],
        },
        format="json",
    )
    inv_id = r.json()["id"]
    r = auth_client.delete(f"/api/invoices/{inv_id}/")
    assert r.status_code == status.HTTP_204_NO_CONTENT
    assert not Invoice.objects.filter(id=inv_id).exists()
