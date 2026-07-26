"""
Note views.
"""
from rest_framework import viewsets, permissions
from rest_framework.exceptions import ValidationError

from ..models import Note
from ..serializers import NoteSerializer
from ..utils.tenant import get_current_tenant_id


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
