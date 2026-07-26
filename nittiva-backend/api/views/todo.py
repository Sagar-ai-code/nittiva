"""
Todo views.
"""
from rest_framework import viewsets, permissions
from rest_framework.exceptions import ValidationError
from rest_framework.decorators import action
from rest_framework.response import Response

from ..models import Todo
from ..serializers import TodoSerializer
from ..utils.tenant import get_current_tenant_id


class TodoViewSet(viewsets.ModelViewSet):
    """ViewSet for todo CRUD.

    Supports filtering by:
      - `?completed=true|false`
      - `?owner=me` (default) or `?owner=<user_id>`
      - `?assigned_to=me` or `?assigned_to=<user_id>`
    """

    serializer_class = TodoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        tenant_id = get_current_tenant_id(self.request)
        if not tenant_id:
            raise ValidationError("Tenant not found.")

        qs = Todo.objects.filter(tenant_id=tenant_id)

        # Completed filter
        completed = self.request.query_params.get("completed")
        if completed is not None:
            qs = qs.filter(completed=completed.lower() in {"1", "true", "yes"})

        # Owner filter (default: current user)
        owner = self.request.query_params.get("owner", "me")
        if owner == "me":
            qs = qs.filter(owner=self.request.user)
        elif owner:
            qs = qs.filter(owner_id=owner)

        # Assigned-to filter
        assigned = self.request.query_params.get("assigned_to")
        if assigned == "me":
            qs = qs.filter(assigned_to=self.request.user)
        elif assigned:
            qs = qs.filter(assigned_to_id=assigned)

        # Project filter
        project_id = self.request.query_params.get("project")
        if project_id:
            qs = qs.filter(project_id=project_id)

        return qs

    def perform_create(self, serializer):
        tenant_id = get_current_tenant_id(self.request)
        if not tenant_id:
            raise ValidationError("Tenant not found.")
        serializer.save(tenant_id=tenant_id)

    @action(detail=True, methods=["post"])
    def toggle(self, request, pk=None):
        """Toggle completion state. Returns the updated todo."""
        todo = self.get_object()
        from django.utils import timezone
        todo.completed = not todo.completed
        todo.completed_at = timezone.now() if todo.completed else None
        todo.save()
        return Response(self.get_serializer(todo).data)
