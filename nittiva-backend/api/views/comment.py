"""
Comment views.

This module contains viewsets for comment management.
"""
from rest_framework import viewsets, permissions
from rest_framework.exceptions import ValidationError
from django.db.models import Q

from ..models import Comment, CommentMention
from ..serializers import CommentSerializer
from ..utils.mentions import parse_mentions
from ..utils.task_subscriptions import (
    maybe_subscribe_on_note_or_comment,
    notify_mentioned_users,
)
from ..utils.tenant import get_current_tenant_id


def _sync_mentions_and_side_effects(comment: Comment, actor):
    """Same shape as Note's mention sync — kept as a separate function so
    each model keeps its own dependency surface clean."""
    try:
        mentioned_ids = parse_mentions(comment.content or "", comment.tenant_id)
        if mentioned_ids:
            CommentMention.objects.bulk_create(
                [
                    CommentMention(
                        comment=comment,
                        mentioned_user_id=uid,
                        created_by=actor,
                        tenant_id=comment.tenant_id,
                    )
                    for uid in mentioned_ids
                ],
                ignore_conflicts=True,
            )
        maybe_subscribe_on_note_or_comment(
            content_type=comment.content_type,
            object_id=comment.object_id,
            author_id=actor.id if actor else None,
            mentioned_user_ids=mentioned_ids,
        )
        if mentioned_ids:
            preview = (comment.content or "")[:140]
            notify_mentioned_users(
                mentioned_user_ids=mentioned_ids,
                actor_id=actor.id if actor else None,
                title="You were mentioned in a comment",
                message=preview,
                link=f"/dashboard/tasks/{comment.object_id}" if comment.content_type == "task" else "",
                tenant_id=comment.tenant_id,
            )
    except Exception:
        import logging
        logging.getLogger(__name__).exception("Mention/subscribe sync failed for comment %s", comment.id)


class CommentViewSet(viewsets.ModelViewSet):
    """ViewSet for comment management."""

    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        tenant_id = get_current_tenant_id(self.request)
        if not tenant_id:
            raise ValidationError("Tenant not found.")

        # Get comments for a specific object
        content_type = self.request.query_params.get("content_type")
        object_id = self.request.query_params.get("object_id")

        qs = Comment.objects.filter(tenant_id=tenant_id)

        if content_type and object_id:
            qs = qs.filter(content_type=content_type, object_id=object_id)

        # Only show top-level comments (no parent) unless parent is specified
        parent_id = self.request.query_params.get("parent_id")
        if parent_id:
            qs = qs.filter(parent_id=parent_id)
        else:
            qs = qs.filter(parent__isnull=True)

        return qs.order_by("-created_at")

    def perform_create(self, serializer):
        tenant_id = get_current_tenant_id(self.request)
        if not tenant_id:
            raise ValidationError("Tenant not found.")
        serializer.save(tenant_id=tenant_id)
        _sync_mentions_and_side_effects(serializer.instance, self.request.user)
