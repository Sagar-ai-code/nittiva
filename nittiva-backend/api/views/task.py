"""
Task views.

This module contains viewsets for task management.
"""

from django.db.models import Q
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import permissions, viewsets
from rest_framework.exceptions import ValidationError

from ..models import Task, TaskSubscriber
from ..serializers import TaskSerializer, TaskSubscriberSerializer
from ..utils.tenant import get_current_tenant_id


class TaskViewSet(viewsets.ModelViewSet):
    """
    ViewSet for task management.

    - Staff sees all
    - Regular users see tasks in accessible projects OR assigned directly
    - Auto-add assignees as project members on create/update
    """

    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["status", "priority", "project"]

    def get_queryset(self):
        """Get queryset filtered by tenant and user permissions."""
        u = self.request.user
        tenant_id = get_current_tenant_id(self.request)
        
        if not tenant_id:
            raise ValidationError("Tenant not found. Please ensure you're accessing via correct subdomain or X-Tenant-Subdomain header.")

        # Start with tenant-scoped queryset
        qs = Task.objects.filter(tenant_id=tenant_id).select_related("project").prefetch_related("assignees")

        # accept either ?project=14 (DRF default) or ?projectId=14 (your UI)
        project_id = self.request.query_params.get("project") or \
                     self.request.query_params.get("projectId")
        if project_id:
            qs = qs.filter(project_id=project_id)

        # Admins/staff: see everything in their tenant
        if getattr(u, "is_staff", False) or getattr(u, "is_superuser", False):
            return qs.order_by("-created_at")

        # Regular users: only tasks assigned to them (and/or they created)
        return (
            qs.filter(Q(assignees=u) | Q(created_by=u))
              .distinct()
              .order_by("-created_at")
        )
    
    def perform_create(self, serializer):
        """Create task with tenant set from request context."""
        tenant_id = get_current_tenant_id(self.request)
        if not tenant_id:
            raise ValidationError("Tenant not found.")
        # tenant_id is already set in serializer.create() method, so just save
        serializer.save()



class TaskSubscriberViewSet(viewsets.ModelViewSet):
    """CRUD on TaskSubscriber — who watches a task.

    Filter via `?task=<id>`. To unsubscribe, just DELETE the row.
    """

    serializer_class = TaskSubscriberSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        tenant_id = get_current_tenant_id(self.request)
        if not tenant_id:
            raise ValidationError("Tenant not found.")
        qs = TaskSubscriber.objects.filter(tenant_id=tenant_id)
        task_id = self.request.query_params.get("task")
        if task_id:
            qs = qs.filter(task_id=task_id)
        user_id = self.request.query_params.get("user")
        if user_id:
            qs = qs.filter(user_id=user_id)
        return qs.order_by("-created_at")

    def perform_create(self, serializer):
        tenant_id = get_current_tenant_id(self.request)
        if not tenant_id:
            raise ValidationError("Tenant not found.")
        # The serializer's create() populates user/created_by/tenant_id
        # from the request, so we just trigger save here.
        try:
            serializer.save(tenant_id=tenant_id)
        except Exception as e:
            # Re-raise with full context so 500 responses show the cause.
            # (DEBUG=False in production strips the default Django error page.)
            import traceback
            raise Exception(
                f"TaskSubscriberViewSet.perform_create failed: "
                f"{type(e).__name__}: {e}\n"
                f"tenant_id={tenant_id!r}, request.user={self.request.user!r}, "
                f"request.tenant={getattr(self.request, 'tenant', None)!r}\n"
                f"{traceback.format_exc()}"
            ) from e
