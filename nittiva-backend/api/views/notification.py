"""
Notification views.
"""
from rest_framework import viewsets, permissions, status
from rest_framework.exceptions import ValidationError
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone

from ..models import Notification
from ..serializers import NotificationSerializer
from ..utils.tenant import get_current_tenant_id


class NotificationViewSet(viewsets.ModelViewSet):
    """ViewSet for per-user notifications.

    Users can only see/manage their OWN notifications. The list endpoint
    auto-scopes to the request user. Use `?recipient=<user_id>` only if
    you're a manager/admin and want to send a notification to someone else.
    """

    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        tenant_id = get_current_tenant_id(self.request)
        if not tenant_id:
            raise ValidationError("Tenant not found.")

        qs = Notification.objects.filter(tenant_id=tenant_id)

        # Default: only the current user's notifications
        recipient = self.request.query_params.get("recipient", "me")
        if recipient == "me":
            qs = qs.filter(recipient=self.request.user)
        elif recipient:
            qs = qs.filter(recipient_id=recipient)

        # Filter: unread only
        if self.request.query_params.get("unread") in {"1", "true", "yes"}:
            qs = qs.filter(is_read=False)

        # Filter: by type
        type_param = self.request.query_params.get("type")
        if type_param:
            qs = qs.filter(type=type_param)

        return qs

    def perform_create(self, serializer):
        tenant_id = get_current_tenant_id(self.request)
        if not tenant_id:
            raise ValidationError("Tenant not found.")
        serializer.save(tenant_id=tenant_id)

    @action(detail=False, methods=["get"], url_path="unread_count")
    def unread_count(self, request):
        """Return the count of unread notifications for the current user."""
        qs = self.get_queryset().filter(is_read=False)
        return Response({"count": qs.count()})

    @action(detail=True, methods=["post"], url_path="mark_read")
    def mark_read(self, request, pk=None):
        """Mark a single notification as read."""
        notif = self.get_object()
        if not notif.is_read:
            notif.is_read = True
            notif.read_at = timezone.now()
            notif.save(update_fields=["is_read", "read_at", "updated_at"])
        return Response(self.get_serializer(notif).data)

    @action(detail=False, methods=["post"], url_path="mark_all_read")
    def mark_all_read(self, request):
        """Mark ALL of the current user's unread notifications as read."""
        now = timezone.now()
        updated = self.get_queryset().filter(is_read=False).update(
            is_read=True, read_at=now, updated_at=now
        )
        return Response({"updated": updated})
