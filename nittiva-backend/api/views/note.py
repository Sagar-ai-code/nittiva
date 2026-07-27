"""
Note views.
"""
from rest_framework import viewsets, permissions
from rest_framework.exceptions import ValidationError

from ..models import Note, NoteMention
from ..serializers import NoteSerializer
from ..utils.mentions import parse_mentions
from ..utils.task_subscriptions import (
    maybe_subscribe_on_note_or_comment,
    notify_mentioned_users,
)
from ..utils.tenant import get_current_tenant_id


def _sync_mentions_and_side_effects(note: Note, actor):
    """Parse @-mentions out of a Note's content, persist them, then trigger
    auto-subscribe + in-app notifications for the mentioned users.

    Best-effort: failures here never bubble up to the caller (we don't want
    a malformed mention to fail the whole note creation).
    """
    try:
        mentioned_ids = parse_mentions(note.content or note.title or "", note.tenant_id)
        # Persist NoteMention rows (ignore_conflicts handles duplicates)
        if mentioned_ids:
            NoteMention.objects.bulk_create(
                [
                    NoteMention(
                        note=note,
                        mentioned_user_id=uid,
                        created_by=actor,
                        tenant_id=note.tenant_id,
                    )
                    for uid in mentioned_ids
                ],
                ignore_conflicts=True,
            )
        # If attached to a task, auto-subscribe relevant users
        maybe_subscribe_on_note_or_comment(
            content_type=note.content_type,
            object_id=note.object_id,
            author_id=actor.id if actor else None,
            mentioned_user_ids=mentioned_ids,
        )
        # Notify each mentioned user
        if mentioned_ids:
            preview = (note.content or "")[:140]
            notify_mentioned_users(
                mentioned_user_ids=mentioned_ids,
                actor_id=actor.id if actor else None,
                title="You were mentioned in a note",
                message=preview,
                link=f"/dashboard/notes?note={note.id}",
                tenant_id=note.tenant_id,
            )
    except Exception:
        # Don't let mention parsing ever fail the note creation
        import logging
        logging.getLogger(__name__).exception("Mention/subscribe sync failed for note %s", note.id)


class NoteViewSet(viewsets.ModelViewSet):
    """ViewSet for note CRUD + filtering by attachment target."""

    serializer_class = NoteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        tenant_id = get_current_tenant_id(self.request)
        if not tenant_id:
            raise ValidationError("Tenant not found.")

        qs = Note.objects.filter(tenant_id=tenant_id)

        content_type = self.request.query_params.get("content_type")
        object_id = self.request.query_params.get("object_id")
        if content_type and object_id:
            qs = qs.filter(content_type=content_type, object_id=object_id)

        return qs.order_by("-is_pinned", "-updated_at")

    def perform_create(self, serializer):
        tenant_id = get_current_tenant_id(self.request)
        if not tenant_id:
            raise ValidationError("Tenant not found.")
        serializer.save(tenant_id=tenant_id)
        _sync_mentions_and_side_effects(serializer.instance, self.request.user)
