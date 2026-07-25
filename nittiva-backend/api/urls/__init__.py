"""
URLs package for Nittiva API.

This package contains all URL routing organized by domain.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from ..views import (
    LoginView,
    register,
    google_auth,
    request_password_reset,
    reset_password,
    dashboard_statistics,
    UserViewSet,
    ClientViewSet,
    ProjectViewSet,
    TaskViewSet,
    TenantViewSet,
    GoalViewSet,
    CommentViewSet,
    AttachmentViewSet,
    TimeLogViewSet,
    CustomFieldViewSet,
    SprintViewSet,
    TaskStatusViewSet,
    TaskPriorityViewSet,
    healthz,
    readyz,
    invite_user_to_project,
    list_project_invitations,
    accept_invitation,
    get_invitation_by_token,
)

# Create router for viewsets
router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'clients', ClientViewSet, basename='client')
router.register(r'projects', ProjectViewSet, basename='project')
router.register(r'tasks', TaskViewSet, basename='task')
router.register(r'tenants', TenantViewSet, basename='tenant')
router.register(r'goals', GoalViewSet, basename='goal')
router.register(r'comments', CommentViewSet, basename='comment')
router.register(r'attachments', AttachmentViewSet, basename='attachment')
router.register(r'time-logs', TimeLogViewSet, basename='time-log')
router.register(r'custom-fields', CustomFieldViewSet, basename='custom-field')
router.register(r'sprints', SprintViewSet, basename='sprint')
router.register(r'task-statuses', TaskStatusViewSet, basename='task-status')
router.register(r'task-priorities', TaskPriorityViewSet, basename='task-priority')

# Main URL patterns
urlpatterns = [
    # Authentication
    path('auth/login', LoginView.as_view(), name='login'),
    path('auth/register', register, name='register'),
    path('auth/google', google_auth, name='google_auth'),
    
    # Password Reset
    path('password/email', request_password_reset, name='request_password_reset'),
    path('password/reset', reset_password, name='reset_password'),
    
    # Dashboard
    path('dashboard/statistics', dashboard_statistics, name='dashboard_statistics'),
    
    # Invitations
    path('projects/<int:project_id>/invite', invite_user_to_project, name='invite_user_to_project'),
    path('projects/<int:project_id>/invitations', list_project_invitations, name='list_project_invitations'),
    path('invitations/accept', accept_invitation, name='accept_invitation'),
    path('invitations/<str:token>', get_invitation_by_token, name='get_invitation_by_token'),

    # Health checks
    path('healthz', healthz, name='healthz'),
    path('readyz', readyz, name='readyz'),

    # Viewsets
    path('', include(router.urls)),
]

