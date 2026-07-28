"""
Task views.

This module contains viewsets for task management.
"""

from django.db.models import Q
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from ..models import Task, TaskSubscriber, TaskHistory
from ..serializers import TaskSerializer, TaskSubscriberSerializer, TaskHistorySerializer
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

    def perform_update(self, serializer):
        """On update, detect assignee changes and write a history row +
        a Notification for the new assignee. Other field changes are
        captured automatically by Task.save().
        """
        instance = serializer.instance
        old_assignee_ids = set(instance.assignees.values_list("id", flat=True))
        updated = serializer.save()
        new_assignee_ids = set(updated.assignees.values_list("id", flat=True))

        added = new_assignee_ids - old_assignee_ids
        removed = old_assignee_ids - new_assignee_ids
        actor = self.request.user if self.request.user.is_authenticated else None

        if added or removed:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            for user_id in added:
                user = User.objects.filter(id=user_id).first()
                if user:
                    TaskHistory.record_assignee_change(
                        task=updated, actor=actor, user=user, action="assigned"
                    )
            for user_id in removed:
                user = User.objects.filter(id=user_id).first()
                if user:
                    TaskHistory.record_assignee_change(
                        task=updated, actor=actor, user=user, action="unassigned"
                    )

    @action(detail=True, methods=["get"], url_path="history")
    def history(self, request, pk=None):
        """Return the activity log for this task.

        `GET /api/tasks/<id>/history/` → 200 with a list of TaskHistory rows
        (newest first). Powers the right sidebar in the task detail UI.
        """
        task = self.get_object()
        rows = task.history.all().select_related("actor")[:200]
        return Response(TaskHistorySerializer(rows, many=True).data)

    @action(detail=True, methods=["get"], url_path="time_per_user")
    def time_per_user(self, request, pk=None):
        """Time spent on this task, broken down by user (admin visibility).

        `GET /api/tasks/<id>/time_per_user/` → 200 with:

          {
            "total_seconds": <sum of all time logs>,
            "completed_in_seconds": <task.created_at to last "updated" verb
                                     that set status=completed, or null>,
            "by_user": [
              {
                "user": {id, email, name, role},
                "total_seconds": N,
                "session_count": M,
                "first_started_at": "...",
                "last_ended_at": "..." | null
              },
              ...
            ]
          }

        The user wanted to see who spent how much time on a task — this
        is the answer. Sorted by total_seconds desc.
        """
        task = self.get_object()
        from django.db.models import Sum, Count, Min, Max, Q
        from ..models import TimeLog

        # Aggregate time logs for this task, grouped by user
        logs = (
            TimeLog.objects
            .filter(tenant_id=task.tenant_id, task_id=task.id)
            .values(
                "user_id",
                "user__email",
                "user__name",
                "user__role",
            )
            .annotate(
                total_seconds=Sum("duration_seconds"),
                session_count=Count("id"),
                first_started_at=Min("started_at"),
                last_ended_at=Max("ended_at"),
            )
            .order_by("-total_seconds")
        )

        by_user = []
        for row in logs:
            by_user.append({
                "user": {
                    "id": row["user_id"],
                    "email": row["user__email"],
                    "name": row.get("user__name") or "",
                    "role": row.get("user__role") or "",
                },
                "total_seconds": int(row["total_seconds"] or 0),
                "session_count": row["session_count"],
                "first_started_at": row["first_started_at"],
                "last_ended_at": row["last_ended_at"],
            })

        total_seconds = sum(u["total_seconds"] for u in by_user)

        # How long from task creation to completion?
        completed_in_seconds = None
        if task.status == "completed":
            completion_row = (
                task.history.filter(verb="updated")
                .filter(diff__has_key="status")
                .order_by("-created_at")
                .first()
            )
            if completion_row and "status" in (completion_row.diff or {}):
                from_, to_ = completion_row.diff["status"]
                if to_ == "completed":
                    delta = (completion_row.created_at - task.created_at).total_seconds()
                    completed_in_seconds = max(0, int(delta))

        return Response({
            "total_seconds": total_seconds,
            "completed_in_seconds": completed_in_seconds,
            "by_user": by_user,
        })



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
        serializer.save(tenant_id=tenant_id)
