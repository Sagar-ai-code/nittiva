"""
Comment views.

This module contains viewsets for comment management.
"""
from rest_framework import viewsets, permissions
from rest_framework.exceptions import ValidationError
from django.db.models import Q

from ..models import Comment
from ..serializers import CommentSerializer
from ..utils.tenant import get_current_tenant_id


class CommentViewSet(viewsets.ModelViewSet):
    """ViewSet for comment management."""
    
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        tenant_id = get_current_tenant_id(self.request)
        if not tenant_id:
            raise ValidationError("Tenant not found.")
        
        # Get comments for a specific object
        content_type = self.request.query_params.get("content_type")
        object_id = self.request.query_params.get("object_id")
        
        qs = Comment.objects.filter(tenant_id=tenant_id)
        
        if content_type and object_id:
            qs = qs.filter(content_type=content_type, object_id=object_id)
        
        # Only show top-level comments (no parent) unless parent is specified
        parent_id = self.request.query_params.get("parent_id")
        if parent_id:
            qs = qs.filter(parent_id=parent_id)
        else:
            qs = qs.filter(parent__isnull=True)
        
        return qs.order_by("-created_at")
    
    def perform_create(self, serializer):
        tenant_id = get_current_tenant_id(self.request)
        if not tenant_id:
            raise ValidationError("Tenant not found.")
        serializer.save(tenant_id=tenant_id)
