"""
Attachment views.

This module contains viewsets for attachment management.
"""
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from django.http import FileResponse
import os

from ..models import Attachment
from ..serializers import AttachmentSerializer
from ..utils.tenant import get_current_tenant_id
from ..utils.responses import success_response, error_response


class AttachmentViewSet(viewsets.ModelViewSet):
    """ViewSet for attachment management."""
    
    serializer_class = AttachmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        tenant_id = get_current_tenant_id(self.request)
        if not tenant_id:
            raise ValidationError("Tenant not found.")
        
        # Get attachments for a specific object
        content_type = self.request.query_params.get("content_type")
        object_id = self.request.query_params.get("object_id")
        
        qs = Attachment.objects.filter(tenant_id=tenant_id)
        
        if content_type and object_id:
            qs = qs.filter(content_type=content_type, object_id=object_id)
        
        return qs.order_by("-created_at")
    
    def perform_create(self, serializer):
        tenant_id = get_current_tenant_id(self.request)
        if not tenant_id:
            raise ValidationError("Tenant not found.")
        serializer.save(tenant_id=tenant_id)
    
    @action(detail=True, methods=["get"])
    def download(self, request, pk=None):
        """Download attachment file."""
        attachment = self.get_object()
        
        # In production, this would stream from S3
        # For now, return the URL
        return Response({
            "file_url": attachment.file_url,
            "file_name": attachment.file_name,
            "file_type": attachment.file_type
        })
