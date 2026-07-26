"""
Meeting views.
"""
from rest_framework import viewsets, permissions
from rest_framework.exceptions import ValidationError
from rest_framework.decorators import action
from rest_framework.response import Response

from ..models import Meeting
from ..serializers import MeetingSerializer
from ..utils.tenant import get_current_tenant_id


class MeetingViewSet(viewsets.ModelViewSet):
    """ViewSet for meeting CRUD.

    Supports filtering by:
      - `?status=scheduled|in_progress|completed|cancelled`
      - `?start_from=ISO&start_to=ISO` (date range)
      - `?participant=me` or `?participant=<user_id>`
      - `?project=<project_id>`
    """

    serializer_class = MeetingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        tenant_id = get_current_tenant_id(self.request)
        if not tenant_id:
            raise ValidationError("Tenant not found.")

        qs = Meeting.objects.filter(tenant_id=tenant_id)

        status_param = self.request.query_params.get("status")
        if status_param:
            qs = qs.filter(status=status_param)

        start_from = self.request.query_params.get("start_from")
        if start_from:
            qs = qs.filter(start_time__gte=start_from)

        start_to = self.request.query_params.get("start_to")
        if start_to:
            qs = qs.filter(start_time__lte=start_to)

        participant = self.request.query_params.get("participant")
        if participant == "me":
            qs = qs.filter(participants=self.request.user)
        elif participant:
            qs = qs.filter(participants__id=participant)

        project_id = self.request.query_params.get("project")
        if project_id:
            qs = qs.filter(project_id=project_id)

        return qs.distinct().order_by("start_time")

    def perform_create(self, serializer):
        tenant_id = get_current_tenant_id(self.request)
        if not tenant_id:
            raise ValidationError("Tenant not found.")
        serializer.save(tenant_id=tenant_id)

    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        """Mark a meeting as cancelled."""
        meeting = self.get_object()
        meeting.status = "cancelled"
        meeting.save(update_fields=["status", "updated_at"])
        return Response(self.get_serializer(meeting).data)

    @action(detail=True, methods=["post"], url_path="add_participants")
    def add_participants(self, request, pk=None):
        """Add users to a meeting. Body: { "user_ids": [uuid, ...] }"""
        meeting = self.get_object()
        user_ids = request.data.get("user_ids", [])
        if not isinstance(user_ids, list):
            return Response({"detail": "user_ids must be a list"}, status=400)
        meeting.participants.add(*user_ids)
        return Response(self.get_serializer(meeting).data)
