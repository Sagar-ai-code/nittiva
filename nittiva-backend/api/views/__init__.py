"""
Views package for Nittiva API.

This package contains all API views organized by domain.
"""

from .auth import LoginView, register, healthz, readyz, google_auth
from .user import UserViewSet
from .client import ClientViewSet
from .project import ProjectViewSet
from .task import TaskViewSet
from .password_reset import request_password_reset, reset_password
from .dashboard import dashboard_statistics
from .invitation import invite_user_to_project, list_project_invitations, accept_invitation, get_invitation_by_token
from .tenant import TenantViewSet
from .goal import GoalViewSet
from .comment import CommentViewSet
from .attachment import AttachmentViewSet
from .time_log import TimeLogViewSet
from .custom_field import CustomFieldViewSet
from .sprint import SprintViewSet
from .task_status import TaskStatusViewSet, TaskPriorityViewSet

__all__ = [
    "LoginView",
    "register",
    "healthz",
    "readyz",
    "google_auth",
    "request_password_reset",
    "reset_password",
    "dashboard_statistics",
    "UserViewSet",
    "ClientViewSet",
    "ProjectViewSet",
    "TaskViewSet",
    "invite_user_to_project",
    "list_project_invitations",
    "accept_invitation",
    "get_invitation_by_token",
    "TenantViewSet",
    "GoalViewSet",
    "CommentViewSet",
    "AttachmentViewSet",
    "TimeLogViewSet",
    "CustomFieldViewSet",
    "SprintViewSet",
    "TaskStatusViewSet",
    "TaskPriorityViewSet",
]

