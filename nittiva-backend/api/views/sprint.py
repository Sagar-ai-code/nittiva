"""
Sprint views.

This module contains viewsets for sprint management.
"""

from django.db.models import Q, Count, Sum
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import permissions, viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError, PermissionDenied

from ..models import Sprint, SprintMember, Task
from ..serializers.sprint import (
    SprintSerializer,
    SprintDetailSerializer,
    SprintSummarySerializer,
    SprintMemberSerializer,
)
from ..utils.tenant import get_current_tenant_id
from ..utils.responses import success_response, error_response


class SprintViewSet(viewsets.ModelViewSet):
    """
    ViewSet for sprint management.
    
    - Managers can create, edit, delete sprints
    - Agents can view sprints they are members of or have tasks in
    - Staff/superusers see all sprints
    """

    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["status", "project"]

    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == "retrieve":
            return SprintDetailSerializer
        elif self.action == "list":
            return SprintSummarySerializer
        return SprintSerializer

    def get_queryset(self):
        """Get queryset filtered by tenant and user permissions."""
        u = self.request.user
        tenant_id = get_current_tenant_id(self.request)

        if not tenant_id:
            raise ValidationError(
                "Tenant not found. Please ensure you're accessing via correct subdomain or X-Tenant-Subdomain header."
            )

        # Start with tenant-scoped queryset
        qs = Sprint.objects.filter(tenant_id=tenant_id)

        # Staff/superusers see all sprints
        if getattr(u, "is_staff", False) or getattr(u, "is_superuser", False):
            return qs.order_by("-start_date", "-created_at")

        # Managers see all sprints in their projects
        if hasattr(u, "role") and u.role == "manager":
            # Managers see sprints from projects they own or are members of
            qs = qs.filter(
                Q(project__owner=u) | Q(project__members=u) | Q(memberships__user=u)
            )
            return qs.distinct().order_by("-start_date", "-created_at")

        # Agents see sprints from projects they're members of, or sprints they're explicitly added to, or sprints with their tasks
        if hasattr(u, "role") and u.role == "agent":
            qs = qs.filter(
                Q(project__members=u) |  # Agents see sprints from projects they're members of
                Q(memberships__user=u) |  # Or sprints they're explicitly added to
                Q(tasks__assignees=u)     # Or sprints with tasks assigned to them
            )
            return qs.distinct().order_by("-start_date", "-created_at")

        # Default: users see sprints from projects they're part of
        qs = qs.filter(
            Q(project__owner=u) | Q(project__members=u) | Q(memberships__user=u) | Q(tasks__assignees=u)
        )
        return qs.distinct().order_by("-start_date", "-created_at")

    def perform_create(self, serializer):
        """Create sprint - only managers and staff can create."""
        user = self.request.user
        if hasattr(user, "role") and user.role == "agent":
            raise PermissionDenied(
                detail="Agents do not have permission to create sprints. Please contact your manager."
            )

        tenant_id = get_current_tenant_id(self.request)
        if not tenant_id:
            raise ValidationError("Tenant not found.")

        serializer.save()

    def perform_update(self, serializer):
        """Update sprint - only managers and staff can update."""
        user = self.request.user
        if hasattr(user, "role") and user.role == "agent":
            raise PermissionDenied(
                detail="Agents do not have permission to edit sprints. Please contact your manager."
            )
        serializer.save()

    def perform_destroy(self, instance):
        """Delete sprint - only managers and staff can delete."""
        user = self.request.user
        if hasattr(user, "role") and user.role == "agent":
            raise PermissionDenied(
                detail="Agents do not have permission to delete sprints. Please contact your manager."
            )
        instance.delete()

    @action(detail=True, methods=["post"])
    def add_member(self, request, pk=None):
        """Add a member to the sprint."""
        sprint = self.get_object()
        user = request.user

        # Only managers and staff can add members
        if hasattr(user, "role") and user.role == "agent":
            return error_response(
                "Agents do not have permission to add sprint members.",
                status_code=status.HTTP_403_FORBIDDEN,
            )

        user_id = request.data.get("user_id")
        role = request.data.get("role", SprintMember.Role.MEMBER)

        if not user_id:
            return error_response("user_id is required.", status_code=status.HTTP_400_BAD_REQUEST)

        tenant_id = get_current_tenant_id(request)
        try:
            from ..models import User

            member_user = User.objects.get(id=user_id, tenant_id=tenant_id)
        except User.DoesNotExist:
            return error_response("User not found.", status_code=status.HTTP_404_NOT_FOUND)

        # Check if member already exists
        if SprintMember.objects.filter(sprint=sprint, user=member_user).exists():
            return error_response(
                "User is already a member of this sprint.",
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        member = SprintMember.objects.create(
            sprint=sprint, user=member_user, role=role, tenant_id=tenant_id
        )

        return success_response(
            SprintMemberSerializer(member, context={"request": request}).data,
            message="Member added to sprint successfully.",
        )

    @action(detail=True, methods=["delete"])
    def remove_member(self, request, pk=None):
        """Remove a member from the sprint."""
        sprint = self.get_object()
        user = request.user

        # Only managers and staff can remove members
        if hasattr(user, "role") and user.role == "agent":
            return error_response(
                "Agents do not have permission to remove sprint members.",
                status_code=status.HTTP_403_FORBIDDEN,
            )

        user_id = request.data.get("user_id")
        if not user_id:
            return error_response("user_id is required.", status_code=status.HTTP_400_BAD_REQUEST)

        try:
            member = SprintMember.objects.get(sprint=sprint, user_id=user_id)
            member.delete()
            return success_response(message="Member removed from sprint successfully.")
        except SprintMember.DoesNotExist:
            return error_response("Member not found.", status_code=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=["get"])
    def burndown(self, request, pk=None):
        """Get burndown chart data for the sprint."""
        sprint = self.get_object()
        tenant_id = get_current_tenant_id(request)

        # Get all tasks in the sprint
        tasks = Task.objects.filter(sprint=sprint, tenant_id=tenant_id).order_by("created_at")

        # Calculate total story points
        total_story_points = sum(task.story_points or 0 for task in tasks)

        # Get daily progress (simplified - you can enhance this with actual date-based tracking)
        from datetime import datetime, timedelta

        burndown_data = []
        if sprint.start_date and sprint.end_date:
            current_date = sprint.start_date
            remaining_points = total_story_points

            while current_date <= sprint.end_date:
                # Count completed tasks up to this date
                completed_tasks = tasks.filter(
                    status=Task.Status.COMPLETED,
                    updated_at__date__lte=current_date,
                )
                completed_points = sum(task.story_points or 0 for task in completed_tasks)
                remaining_points = total_story_points - completed_points

                burndown_data.append(
                    {
                        "date": current_date.isoformat(),
                        "remaining_points": max(0, remaining_points),
                        "completed_points": completed_points,
                        "total_points": total_story_points,
                    }
                )

                current_date += timedelta(days=1)

        return success_response(
            {
                "sprint_id": sprint.id,
                "sprint_name": sprint.name,
                "start_date": sprint.start_date.isoformat() if sprint.start_date else None,
                "end_date": sprint.end_date.isoformat() if sprint.end_date else None,
                "total_story_points": total_story_points,
                "burndown": burndown_data,
            }
        )

    @action(detail=True, methods=["get"])
    def statistics(self, request, pk=None):
        """Get sprint statistics."""
        sprint = self.get_object()
        tenant_id = get_current_tenant_id(request)

        tasks = Task.objects.filter(sprint=sprint, tenant_id=tenant_id)

        # Task counts by status
        task_counts = tasks.values("status").annotate(count=Count("id"))

        # Story points by status
        story_points_by_status = (
            tasks.values("status")
            .annotate(total_points=Sum("story_points"))
            .order_by("status")
        )

        # Time tracking (if available)
        from ..models import TimeLog

        time_logs = TimeLog.objects.filter(
            task__sprint=sprint, tenant_id=tenant_id
        ).aggregate(total_time=Sum("duration_seconds"))

        # Agent contributions
        agent_contributions = (
            tasks.values("assignees__email", "assignees__name")
            .annotate(
                task_count=Count("id"),
                story_points=Sum("story_points"),
            )
            .order_by("-story_points")
        )

        return success_response(
            {
                "sprint_id": sprint.id,
                "sprint_name": sprint.name,
                "task_counts": list(task_counts),
                "story_points_by_status": list(story_points_by_status),
                "total_time_seconds": time_logs["total_time"] or 0,
                "agent_contributions": list(agent_contributions),
                "velocity_target": sprint.velocity_target,
                "actual_velocity": sprint.actual_velocity or sprint.calculate_velocity(),
            }
        )

    @action(detail=True, methods=["post"])
    def add_tasks(self, request, pk=None):
        """Add tasks to the sprint."""
        sprint = self.get_object()
        user = request.user

        # Only managers and staff can add tasks
        if hasattr(user, "role") and user.role == "agent":
            return error_response(
                "Agents do not have permission to add tasks to sprints.",
                status_code=status.HTTP_403_FORBIDDEN,
            )

        task_ids = request.data.get("task_ids", [])
        if not task_ids or not isinstance(task_ids, list):
            return error_response(
                "task_ids must be a list of task IDs.",
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        tenant_id = get_current_tenant_id(request)
        tasks = Task.objects.filter(id__in=task_ids, tenant_id=tenant_id)

        if tasks.count() != len(task_ids):
            return error_response(
                "Some tasks were not found or do not belong to your tenant.",
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        # Update tasks to belong to this sprint
        updated_count = tasks.update(sprint=sprint)

        # Recalculate velocity
        sprint.calculate_velocity()

        return success_response(
            {"updated_count": updated_count},
            message=f"Added {updated_count} task(s) to sprint.",
        )

    @action(detail=True, methods=["post"])
    def remove_tasks(self, request, pk=None):
        """Remove tasks from the sprint."""
        sprint = self.get_object()
        user = request.user

        # Only managers and staff can remove tasks
        if hasattr(user, "role") and user.role == "agent":
            return error_response(
                "Agents do not have permission to remove tasks from sprints.",
                status_code=status.HTTP_403_FORBIDDEN,
            )

        task_ids = request.data.get("task_ids", [])
        if not task_ids or not isinstance(task_ids, list):
            return error_response(
                "task_ids must be a list of task IDs.",
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        tenant_id = get_current_tenant_id(request)
        tasks = Task.objects.filter(id__in=task_ids, sprint=sprint, tenant_id=tenant_id)

        # Remove sprint from tasks
        updated_count = tasks.update(sprint=None)

        # Recalculate velocity
        sprint.calculate_velocity()

        return success_response(
            {"updated_count": updated_count},
            message=f"Removed {updated_count} task(s) from sprint.",
        )
