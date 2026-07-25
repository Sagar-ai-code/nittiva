"""
Dashboard views.

This module contains views for dashboard statistics and overview.
"""

from django.db.models import Q, Count, Sum, F, Case, When, IntegerField
from django.db.models.functions import Coalesce
from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from ..models import Project, Task, ProjectMember
from django.contrib.auth import get_user_model
from ..utils.responses import success_response, error_response
from ..utils.tenant import get_current_tenant_id

User = get_user_model()


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def dashboard_statistics(request):
    """
    Get dashboard statistics for the current user.
    
    Returns aggregated data including:
    - Total projects count
    - Active tasks count
    - Team members count
    - Project statistics (by status)
    - Task statistics (by status)
    - Recent activities
    - Team overview
    """
    user = request.user
    tenant_id = get_current_tenant_id(request)
    
    if not tenant_id:
        return error_response(
            message="Tenant not found. Please ensure you're accessing via correct subdomain or X-Tenant-Subdomain header.",
            status_code=status.HTTP_400_BAD_REQUEST,
        )
    
    is_admin = getattr(user, "is_staff", False) or getattr(user, "is_superuser", False)
    
    try:
        # Get projects accessible to user (tenant-scoped)
        if is_admin:
            projects_qs = Project.objects.filter(tenant_id=tenant_id)
            tasks_qs = Task.objects.filter(tenant_id=tenant_id)
            users_qs = User.objects.filter(tenant_id=tenant_id, is_active=True)
        else:
            projects_qs = Project.objects.filter(
                tenant_id=tenant_id
            ).filter(
                Q(owner=user) | Q(members=user) | Q(tasks__assignees=user)
            ).distinct()
            tasks_qs = Task.objects.filter(
                tenant_id=tenant_id
            ).filter(
                Q(assignees=user) | Q(created_by=user) | Q(project__in=projects_qs)
            ).distinct()
            # Get unique users from accessible projects and tasks
            user_ids = set()
            user_ids.update(projects_qs.values_list("owner_id", flat=True).exclude(owner_id__isnull=True))
            user_ids.update(ProjectMember.objects.filter(project__in=projects_qs).values_list("user_id", flat=True))
            user_ids.update(tasks_qs.values_list("assignees", flat=True))
            users_qs = User.objects.filter(id__in=user_ids, is_active=True).distinct()
        
        # Project Statistics
        total_projects = projects_qs.count()
        projects_by_status = projects_qs.values("status").annotate(count=Count("id"))
        project_status_map = {item["status"]: item["count"] for item in projects_by_status}
        
        # Task Statistics
        total_tasks = tasks_qs.count()
        tasks_by_status = tasks_qs.values("status").annotate(count=Count("id"))
        task_status_map = {item["status"]: item["count"] for item in tasks_by_status}
        
        # Count active tasks (not completed)
        active_tasks = tasks_qs.exclude(status="completed").count()
        completed_tasks = tasks_qs.filter(status="completed").count()
        
        # Team Statistics
        total_team_members = users_qs.count()
        
        # Get team members with task counts (for admin view)
        team_members_with_tasks = []
        if is_admin:
            for member in users_qs[:10]:  # Limit to 10 for dashboard
                task_count = Task.objects.filter(tenant_id=tenant_id, assignees=member).count()
                team_members_with_tasks.append({
                    "id": member.id,
                    "email": member.email,
                    "name": member.name or member.email.split("@")[0],
                    "role": member.role,
                    "tasksCount": task_count,
                    "profile_image_url": member.profile_image_url,
                })
        else:
            # For regular users, show team members from their projects
            for member in users_qs[:10]:
                task_count = Task.objects.filter(
                    tenant_id=tenant_id,
                    assignees=member,
                    project__in=projects_qs
                ).count()
                team_members_with_tasks.append({
                    "id": member.id,
                    "email": member.email,
                    "name": member.name or member.email.split("@")[0],
                    "role": member.role,
                    "tasksCount": task_count,
                    "profile_image_url": member.profile_image_url,
                })
        
        # Calculate progress percentages
        project_progress = 0
        if total_projects > 0:
            completed_projects = project_status_map.get("completed", 0)
            project_progress = int((completed_projects / total_projects) * 100)
        
        task_completion = 0
        if total_tasks > 0:
            task_completion = int((completed_tasks / total_tasks) * 100)
        
        # Prepare statistics
        statistics = {
            "overview": {
                "total_projects": total_projects,
                "active_tasks": active_tasks,
                "total_tasks": total_tasks,
                "team_members": total_team_members,
            },
            "projects": {
                "total": total_projects,
                "by_status": {
                    "open": project_status_map.get("todo", 0),
                    "in_progress": project_status_map.get("in-progress", 0),
                    "completed": project_status_map.get("completed", 0),
                    "archived": project_status_map.get("archived", 0),
                    "active": project_status_map.get("in-progress", 0) + project_status_map.get("todo", 0),
                },
                "progress_percentage": project_progress,
            },
            "tasks": {
                "total": total_tasks,
                "by_status": {
                    "to_do": task_status_map.get("to-do", 0),
                    "in_progress": task_status_map.get("in-progress", 0),
                    "completed": task_status_map.get("completed", 0),
                    "review": task_status_map.get("review", 0),
                    "open": task_status_map.get("to-do", 0) + task_status_map.get("review", 0),
                    "active": task_status_map.get("in-progress", 0),
                },
                "completion_percentage": task_completion,
            },
            "team": {
                "total_members": total_team_members,
                "members": team_members_with_tasks,
            },
            "is_admin": is_admin,
        }
        
        return success_response(
            data=statistics,
            message="Dashboard statistics retrieved successfully",
            status_code=status.HTTP_200_OK,
        )
    
    except Exception as e:
        import traceback
        return error_response(
            message=f"Failed to retrieve dashboard statistics: {str(e)}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


