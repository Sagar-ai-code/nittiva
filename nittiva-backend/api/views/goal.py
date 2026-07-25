"""
Goal views.

This module contains viewsets for goal management.
"""
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from django.db.models import Q

from ..models import Goal, GoalLinkedEntity
from ..serializers import GoalSerializer, GoalLinkedEntitySerializer
from ..utils.tenant import get_current_tenant_id
from ..utils.responses import success_response, error_response


class GoalViewSet(viewsets.ModelViewSet):
    """ViewSet for goal management."""
    
    serializer_class = GoalSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        tenant_id = get_current_tenant_id(self.request)
        if not tenant_id:
            raise ValidationError("Tenant not found.")
        
        user = self.request.user
        qs = Goal.objects.filter(tenant_id=tenant_id)
        
        # Filter by status if provided
        status_filter = self.request.query_params.get("status")
        if status_filter:
            qs = qs.filter(status=status_filter)
        
        # Filter by owner if not admin
        if not (user.is_staff or user.is_superuser):
            # Users see goals they own or goals linked to their projects
            user_project_ids = user.projects.values_list("id", flat=True)
            qs = qs.filter(
                Q(owner=user) | 
                Q(linked_entities__entity_type="project", linked_entities__entity_id__in=user_project_ids)
            )
        
        return qs.distinct().order_by("-created_at")
    
    def perform_create(self, serializer):
        tenant_id = get_current_tenant_id(self.request)
        if not tenant_id:
            raise ValidationError("Tenant not found.")
        serializer.save(tenant_id=tenant_id)
    
    @action(detail=True, methods=["post"])
    def link_entity(self, request, pk=None):
        """Link a project or task to this goal."""
        goal = self.get_object()
        entity_type = request.data.get("entity_type")
        entity_id = request.data.get("entity_id")
        weight = request.data.get("weight", 1.0)
        
        if not entity_type or not entity_id:
            return error_response(
                "entity_type and entity_id are required",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        linked_entity, created = GoalLinkedEntity.objects.get_or_create(
            goal=goal,
            entity_type=entity_type,
            entity_id=entity_id,
            defaults={
                "tenant_id": goal.tenant_id,
                "weight": weight
            }
        )
        
        # Recalculate goal progress
        goal.calculate_progress()
        
        return success_response(
            data=GoalLinkedEntitySerializer(linked_entity).data,
            message="Entity linked successfully"
        )
    
    @action(detail=True, methods=["post"])
    def unlink_entity(self, request, pk=None):
        """Unlink an entity from this goal."""
        goal = self.get_object()
        entity_type = request.data.get("entity_type")
        entity_id = request.data.get("entity_id")
        
        if not entity_type or not entity_id:
            return error_response(
                "entity_type and entity_id are required",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        deleted = GoalLinkedEntity.objects.filter(
            goal=goal,
            entity_type=entity_type,
            entity_id=entity_id
        ).delete()
        
        if deleted[0] > 0:
            goal.calculate_progress()
            return success_response(message="Entity unlinked successfully")
        else:
            return error_response(
                "Link not found",
                status_code=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=["get"])
    def progress(self, request, pk=None):
        """Get goal progress with detailed breakdown."""
        goal = self.get_object()
        goal.calculate_progress()
        
        return success_response(
            data={
                "progress_percentage": goal.progress_percentage,
                "current_value": float(goal.current_value),
                "target_value": float(goal.target_value) if goal.target_value else None,
                "linked_entities_count": goal.linked_entities.count(),
                "child_goals_count": goal.child_goals.count(),
            }
        )
