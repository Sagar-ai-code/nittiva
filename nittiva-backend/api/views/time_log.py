"""
Time log views.

This module contains viewsets for time log management.
"""
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from django.db.models import Sum, Q
from django.utils import timezone
from datetime import timedelta

from ..models import TimeLog, Task
from ..serializers import TimeLogSerializer
from ..utils.tenant import get_current_tenant_id
from ..utils.responses import success_response, error_response


class TimeLogViewSet(viewsets.ModelViewSet):
    """ViewSet for time log management."""
    
    serializer_class = TimeLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        tenant_id = get_current_tenant_id(self.request)
        if not tenant_id:
            raise ValidationError("Tenant not found.")
        
        user = self.request.user
        qs = TimeLog.objects.filter(tenant_id=tenant_id)
        
        # Filter by task if provided
        task_id = self.request.query_params.get("task")
        if task_id:
            qs = qs.filter(task_id=task_id)
        
        # Filter by user if provided (for manager view)
        user_id = self.request.query_params.get("user")
        if user_id:
            qs = qs.filter(user_id=user_id)
        
        # Permission-based filtering:
        # - Agents can only see their own time logs
        # - Managers can see all agents' time logs
        # - Staff/Superusers can see all
        if hasattr(user, 'role'):
            if user.role == "agent":
                # Agents can only see their own entries
                qs = qs.filter(user=user)
            elif user.role == "manager":
                # Managers can see all agents' entries (but not other managers')
                from ..models import User
                agent_ids = User.objects.filter(
                    tenant_id=tenant_id,
                    role="agent"
                ).values_list('id', flat=True)
                qs = qs.filter(user_id__in=list(agent_ids) + [user.id])
        elif not (user.is_staff or user.is_superuser):
            # Fallback: non-staff users see only their own
            qs = qs.filter(user=user)
        
        # Filter by date range
        start_date = self.request.query_params.get("start_date")
        end_date = self.request.query_params.get("end_date")
        if start_date:
            qs = qs.filter(started_at__gte=start_date)
        if end_date:
            qs = qs.filter(started_at__lte=end_date)
        
        return qs.order_by("-started_at")
    
    def perform_create(self, serializer):
        """Create time log entry - only agents can create their own entries."""
        tenant_id = get_current_tenant_id(self.request)
        if not tenant_id:
            raise ValidationError("Tenant not found.")
        
        user = self.request.user
        
        # Only agents can create time log entries (managers can view but not create)
        if hasattr(user, 'role') and user.role != "agent":
            if not (user.is_staff or user.is_superuser):
                raise ValidationError("Only agents can create time log entries.")
        
        # Ensure the entry is created for the current user
        serializer.save(tenant_id=tenant_id, user=user)
    
    def perform_update(self, serializer):
        """Update time log - agents can only update their own entries."""
        instance = serializer.instance
        user = self.request.user
        
        # Agents can only update their own entries
        if hasattr(user, 'role') and user.role == "agent":
            if instance.user_id != user.id:
                raise ValidationError("You can only update your own time log entries.")
        
        # Managers and staff can update any entry
        serializer.save()
    
    def perform_destroy(self, instance):
        """Delete time log - agents can only delete their own entries."""
        user = self.request.user
        
        # Agents can only delete their own entries
        if hasattr(user, 'role') and user.role == "agent":
            if instance.user_id != user.id:
                raise ValidationError("You can only delete your own time log entries.")
        
        instance.delete()
    
    @action(detail=False, methods=["post"])
    def start_timer(self, request):
        """Start a timer for a task."""
        task_id = request.data.get("task_id")
        if not task_id:
            return error_response(
                "task_id is required",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        tenant_id = get_current_tenant_id(request)
        if not tenant_id:
            raise ValidationError("Tenant not found.")
        
        # Check if user already has an active timer
        active_timer = TimeLog.objects.filter(
            tenant_id=tenant_id,
            user=request.user,
            ended_at__isnull=True
        ).first()
        
        if active_timer:
            return error_response(
                "You already have an active timer. Please stop it first.",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        # Create new time log
        time_log = TimeLog.objects.create(
            tenant_id=tenant_id,
            task_id=task_id,
            user=request.user,
            started_at=timezone.now(),
            is_manual=False
        )
        
        return success_response(
            data=TimeLogSerializer(time_log).data,
            message="Timer started"
        )
    
    @action(detail=True, methods=["post"])
    def stop_timer(self, request, pk=None):
        """Stop a timer."""
        time_log = self.get_object()
        
        if time_log.ended_at:
            return error_response(
                "Timer is already stopped",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        time_log.ended_at = timezone.now()
        time_log.save()
        
        # Update task's total time
        task = time_log.task
        task.time_tracked_seconds = TimeLog.objects.filter(
            tenant_id=task.tenant_id,
            task=task
        ).aggregate(total=Sum("duration_seconds"))["total"] or 0
        task.save(update_fields=["time_tracked_seconds"])
        
        return success_response(
            data=TimeLogSerializer(time_log).data,
            message="Timer stopped"
        )
    
    @action(detail=False, methods=["get"])
    def active_timer(self, request):
        """Get active timer for current user."""
        tenant_id = get_current_tenant_id(request)
        if not tenant_id:
            raise ValidationError("Tenant not found.")
        
        active_timer = TimeLog.objects.filter(
            tenant_id=tenant_id,
            user=request.user,
            ended_at__isnull=True
        ).first()
        
        if active_timer:
            return success_response(
                data=TimeLogSerializer(active_timer).data
            )
        else:
            return success_response(data=None, message="No active timer")
    
    @action(detail=False, methods=["get"])
    def summary(self, request):
        """Get time tracking summary."""
        tenant_id = get_current_tenant_id(request)
        if not tenant_id:
            raise ValidationError("Tenant not found.")
        
        user = request.user
        qs = TimeLog.objects.filter(tenant_id=tenant_id)
        
        # Apply role-based filtering
        if hasattr(user, 'role'):
            if user.role == "agent":
                qs = qs.filter(user=user)
            elif user.role == "manager":
                # Managers see all agents' data
                from ..models import User
                agent_ids = User.objects.filter(
                    tenant_id=tenant_id,
                    role="agent"
                ).values_list('id', flat=True)
                qs = qs.filter(user_id__in=list(agent_ids))
        elif not (user.is_staff or user.is_superuser):
            qs = qs.filter(user=user)
        
        # Total time
        total_seconds = qs.aggregate(total=Sum("duration_seconds"))["total"] or 0
        
        # Time by task
        task_summary = qs.filter(task__isnull=False).values("task__id", "task__title").annotate(
            total_seconds=Sum("duration_seconds")
        ).order_by("-total_seconds")[:10]
        
        # Time by user (for managers and admins)
        user_summary = None
        if hasattr(user, 'role') and (user.role == "manager" or user.is_staff or user.is_superuser):
            user_summary = qs.values("user__id", "user__name", "user__email", "user__role").annotate(
                total_seconds=Sum("duration_seconds")
            ).order_by("-total_seconds")[:10]
        
        return success_response(
            data={
                "total_seconds": total_seconds,
                "total_hours": round(total_seconds / 3600, 2),
                "task_summary": list(task_summary),
                "user_summary": list(user_summary) if user_summary else None,
            }
        )
    
    @action(detail=False, methods=["post"])
    def log_work(self, request):
        """Agent work logging endpoint - allows agents to log work with description."""
        tenant_id = get_current_tenant_id(request)
        if not tenant_id:
            raise ValidationError("Tenant not found.")
        
        user = request.user
        
        # Only agents can log work
        if not hasattr(user, 'role') or user.role != "agent":
            return error_response(
                "Only agents can log work entries.",
                status_code=status.HTTP_403_FORBIDDEN
            )
        
        description = request.data.get("description", "").strip()
        task_id = request.data.get("task_id")
        duration_seconds = request.data.get("duration_seconds")
        started_at = request.data.get("started_at")
        ended_at = request.data.get("ended_at")
        
        if not description:
            return error_response(
                "Description is required.",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate that we have either duration_seconds OR both started_at and ended_at
        has_duration = duration_seconds is not None and duration_seconds > 0
        has_time_range = started_at and ended_at
        
        if not has_duration and not has_time_range:
            return error_response(
                "Either duration_seconds (> 0) or both started_at and ended_at are required.",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        # Create time log entry
        time_log_data = {
            "tenant_id": tenant_id,
            "user": user,
            "description": description,
            "is_manual": True,
        }
        
        if task_id:
            time_log_data["task_id"] = task_id
        
        # Handle time range
        if started_at:
            from django.utils.dateparse import parse_datetime
            time_log_data["started_at"] = parse_datetime(started_at) or timezone.now()
        else:
            time_log_data["started_at"] = timezone.now()
        
        if ended_at:
            from django.utils.dateparse import parse_datetime
            time_log_data["ended_at"] = parse_datetime(ended_at)
            # Calculate duration from time range if both are provided
            if time_log_data["started_at"] and time_log_data["ended_at"]:
                delta = time_log_data["ended_at"] - time_log_data["started_at"]
                time_log_data["duration_seconds"] = max(0, int(delta.total_seconds()))
        
        # Use provided duration_seconds if available and not calculated from time range
        if duration_seconds is not None and "duration_seconds" not in time_log_data:
            time_log_data["duration_seconds"] = max(0, int(duration_seconds))
        elif "duration_seconds" not in time_log_data:
            # Default to 0 if neither duration nor time range provided (shouldn't happen due to validation)
            time_log_data["duration_seconds"] = 0
        
        time_log = TimeLog.objects.create(**time_log_data)
        
        return success_response(
            data=TimeLogSerializer(time_log, context={"request": request}).data,
            message="Work logged successfully"
        )
    
    @action(detail=False, methods=["get"])
    def agents_summary(self, request):
        """Manager view: Get summary of all agents' time logs."""
        tenant_id = get_current_tenant_id(request)
        if not tenant_id:
            raise ValidationError("Tenant not found.")
        
        user = request.user
        
        # Only managers and admins can access this
        if hasattr(user, 'role') and user.role != "manager":
            if not (user.is_staff or user.is_superuser):
                return error_response(
                    "Only managers can view agents summary.",
                    status_code=status.HTTP_403_FORBIDDEN
                )
        
        from ..models import User
        
        # Get all agents in the tenant
        agents = User.objects.filter(tenant_id=tenant_id, role="agent")
        
        # Get time logs for all agents
        agent_ids = list(agents.values_list('id', flat=True))
        qs = TimeLog.objects.filter(tenant_id=tenant_id, user_id__in=agent_ids)
        
        # Filter by date range if provided
        start_date = request.query_params.get("start_date")
        end_date = request.query_params.get("end_date")
        if start_date:
            qs = qs.filter(started_at__gte=start_date)
        if end_date:
            qs = qs.filter(started_at__lte=end_date)
        
        # Group by agent
        agents_data = []
        for agent in agents:
            agent_logs = qs.filter(user=agent)
            total_seconds = agent_logs.aggregate(total=Sum("duration_seconds"))["total"] or 0
            entry_count = agent_logs.count()
            
            agents_data.append({
                "agent_id": agent.id,
                "agent_name": agent.name,
                "agent_email": agent.email,
                "total_seconds": total_seconds,
                "total_hours": round(total_seconds / 3600, 2),
                "entry_count": entry_count,
                "recent_entries": TimeLogSerializer(
                    agent_logs[:5],
                    many=True,
                    context={"request": request}
                ).data
            })
        
        # Overall summary
        total_seconds = qs.aggregate(total=Sum("duration_seconds"))["total"] or 0
        
        return success_response(
            data={
                "total_seconds": total_seconds,
                "total_hours": round(total_seconds / 3600, 2),
                "total_entries": qs.count(),
                "agents": agents_data,
            }
        )
