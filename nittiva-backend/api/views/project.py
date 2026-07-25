"""
Project views.

This module contains viewsets for project management.
"""

from django.db.models import Q, Count
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import permissions, viewsets
from rest_framework.exceptions import ValidationError, PermissionDenied

from ..models import Project
from ..serializers import ProjectSerializer
from ..utils.tenant import get_current_tenant_id


class ProjectViewSet(viewsets.ModelViewSet):
    """
    ViewSet for project management.
    
    - Staff sees all
    - Regular users see projects they own, are members of, OR have tasks in
      (so assignees will see the project in the sidebar)
    - Agents CANNOT create or update projects (read-only access)
    """

    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["status", "client"]

    def get_queryset(self):
        """Get queryset filtered by tenant and user permissions."""
        u = self.request.user
        tenant_id = get_current_tenant_id(self.request)
        
        if not tenant_id:
            raise ValidationError("Tenant not found. Please ensure you're accessing via correct subdomain or X-Tenant-Subdomain header.")

        # Start with tenant-scoped queryset
        qs = Project.objects.filter(tenant_id=tenant_id)

        # optional scope handling: ?scope=all for staff
        scope = self.request.query_params.get("scope", "mine")

        if getattr(u, "is_staff", False) or getattr(u, "is_superuser", False):
            if scope != "all":
                qs = qs.filter(Q(owner=u) | Q(members=u) | Q(tasks__assignees=u))
        else:
            qs = qs.filter(
                Q(owner=u) | Q(members=u) | Q(tasks__assignees=u)
            )

        # annotate per-user task count (useful for the sidebar badges)
        return (
            qs.distinct()
            .annotate(task_count=Count("tasks", filter=Q(tasks__assignees=u)))
            .order_by("-created_at")
        )

    def perform_create(self, serializer):
        """Create project with tenant and owner set from request context."""
        # Prevent agents from creating projects
        user = self.request.user
        if hasattr(user, 'role') and user.role == "agent":
            raise PermissionDenied(
                detail="Agents do not have permission to create projects. Please contact your manager."
            )
        
        tenant_id = get_current_tenant_id(self.request)
        if not tenant_id:
            raise ValidationError("Tenant not found.")
        # tenant_id is already set in serializer.create() method, so just save
        serializer.save()
    
    def perform_update(self, serializer):
        """Update project - prevent agents from editing."""
        # Prevent agents from updating projects
        user = self.request.user
        if hasattr(user, 'role') and user.role == "agent":
            raise PermissionDenied(
                detail="Agents do not have permission to edit projects. Please contact your manager."
            )
        serializer.save()
    
    def perform_destroy(self, instance):
        """Delete project - prevent agents from deleting."""
        # Prevent agents from deleting projects
        user = self.request.user
        if hasattr(user, 'role') and user.role == "agent":
            raise PermissionDenied(
                detail="Agents do not have permission to delete projects. Please contact your manager."
            )
        instance.delete()

