"""
Task Status and Priority views.

This module contains ViewSets for managing TaskStatus and TaskPriority.
"""

from django.db.models import Q
from rest_framework import permissions, viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError, PermissionDenied

from ..models import TaskStatus, TaskPriority, Task
from ..serializers.task_status import TaskStatusSerializer, TaskPrioritySerializer
from ..utils.tenant import get_current_tenant_id
from ..utils.responses import success_response, error_response


class TaskStatusViewSet(viewsets.ModelViewSet):
    """ViewSet for managing TaskStatus."""
    
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = TaskStatusSerializer
    
    def get_queryset(self):
        """Get statuses for current tenant."""
        u = self.request.user
        tenant_id = get_current_tenant_id(self.request)
        
        if not tenant_id:
            raise ValidationError("Tenant not found. Please ensure you're accessing via correct subdomain or X-Tenant-Subdomain header.")
        
        qs = TaskStatus.objects.filter(tenant_id=tenant_id)
        
        # Filter by active status if requested
        is_active = self.request.query_params.get("is_active")
        if is_active is not None:
            qs = qs.filter(is_active=is_active.lower() == "true")
        
        return qs.order_by("order", "name")
    
    def perform_create(self, serializer):
        """Create status - only managers and above can create."""
        user = self.request.user
        if hasattr(user, "role") and user.role == "agent":
            raise PermissionDenied(detail="Agents do not have permission to create statuses. Please contact your manager.")
        serializer.save()
    
    def perform_update(self, serializer):
        """Update status - only managers and above can update."""
        user = self.request.user
        if hasattr(user, "role") and user.role == "agent":
            raise PermissionDenied(detail="Agents do not have permission to edit statuses. Please contact your manager.")
        serializer.save()
    
    def perform_destroy(self, instance):
        """Delete status - only managers and above can delete."""
        user = self.request.user
        if hasattr(user, "role") and user.role == "agent":
            raise PermissionDenied(detail="Agents do not have permission to delete statuses. Please contact your manager.")
        
        # Check if status is in use
        task_count = Task.objects.filter(tenant_id=instance.tenant_id, custom_status=instance).count()
        if task_count > 0:
            raise ValidationError(f"Cannot delete status '{instance.name}' because it is used by {task_count} task(s). Please reassign those tasks first.")
        
        instance.delete()
    
    @action(detail=True, methods=["post"])
    def reorder(self, request, pk=None):
        """Update the order of a status."""
        status_obj = self.get_object()
        new_order = request.data.get("order")
        
        if new_order is None:
            return error_response("Order is required.", status_code=status.HTTP_400_BAD_REQUEST)
        
        try:
            new_order = int(new_order)
        except (ValueError, TypeError):
            return error_response("Order must be a number.", status_code=status.HTTP_400_BAD_REQUEST)
        
        status_obj.order = new_order
        status_obj.save(update_fields=["order"])
        
        return success_response(
            TaskStatusSerializer(status_obj, context={"request": request}).data,
            "Status order updated successfully."
        )
    
    @action(detail=False, methods=["post"])
    def bulk_reorder(self, request):
        """Bulk update order of multiple statuses."""
        orders = request.data.get("orders", [])
        
        if not isinstance(orders, list):
            return error_response("Orders must be a list of {id: order} objects.", status_code=status.HTTP_400_BAD_REQUEST)
        
        tenant_id = get_current_tenant_id(request)
        if not tenant_id:
            return error_response("Tenant not found.", status_code=status.HTTP_400_BAD_REQUEST)
        
        updated = []
        for item in orders:
            status_id = item.get("id")
            new_order = item.get("order")
            
            if not status_id or new_order is None:
                continue
            
            try:
                status_obj = TaskStatus.objects.get(id=status_id, tenant_id=tenant_id)
                status_obj.order = int(new_order)
                status_obj.save(update_fields=["order"])
                updated.append(status_obj)
            except (TaskStatus.DoesNotExist, ValueError, TypeError):
                continue
        
        return success_response(
            TaskStatusSerializer(updated, many=True, context={"request": request}).data,
            f"Updated order for {len(updated)} status(es)."
        )
    
    @action(detail=False, methods=["get"])
    def statistics(self, request):
        """Get statistics about status usage."""
        tenant_id = get_current_tenant_id(request)
        if not tenant_id:
            return error_response("Tenant not found.", status_code=status.HTTP_400_BAD_REQUEST)
        
        statuses = TaskStatus.objects.filter(tenant_id=tenant_id, is_active=True)
        stats = []
        
        for status_obj in statuses:
            task_count = Task.objects.filter(tenant_id=tenant_id, custom_status=status_obj).count()
            stats.append({
                "id": str(status_obj.id),
                "name": status_obj.name,
                "slug": status_obj.slug,
                "task_count": task_count,
            })
        
        return success_response({"statistics": stats})


class TaskPriorityViewSet(viewsets.ModelViewSet):
    """ViewSet for managing TaskPriority."""
    
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = TaskPrioritySerializer
    
    def get_queryset(self):
        """Get priorities for current tenant."""
        u = self.request.user
        tenant_id = get_current_tenant_id(self.request)
        
        if not tenant_id:
            raise ValidationError("Tenant not found. Please ensure you're accessing via correct subdomain or X-Tenant-Subdomain header.")
        
        qs = TaskPriority.objects.filter(tenant_id=tenant_id)
        
        # Filter by active status if requested
        is_active = self.request.query_params.get("is_active")
        if is_active is not None:
            qs = qs.filter(is_active=is_active.lower() == "true")
        
        return qs.order_by("order", "weight", "name")
    
    def perform_create(self, serializer):
        """Create priority - only managers and above can create."""
        user = self.request.user
        if hasattr(user, "role") and user.role == "agent":
            raise PermissionDenied(detail="Agents do not have permission to create priorities. Please contact your manager.")
        serializer.save()
    
    def perform_update(self, serializer):
        """Update priority - only managers and above can update."""
        user = self.request.user
        if hasattr(user, "role") and user.role == "agent":
            raise PermissionDenied(detail="Agents do not have permission to edit priorities. Please contact your manager.")
        serializer.save()
    
    def perform_destroy(self, instance):
        """Delete priority - only managers and above can delete."""
        user = self.request.user
        if hasattr(user, "role") and user.role == "agent":
            raise PermissionDenied(detail="Agents do not have permission to delete priorities. Please contact your manager.")
        
        # Check if priority is in use
        task_count = Task.objects.filter(tenant_id=instance.tenant_id, custom_priority=instance).count()
        if task_count > 0:
            raise ValidationError(f"Cannot delete priority '{instance.name}' because it is used by {task_count} task(s). Please reassign those tasks first.")
        
        instance.delete()
    
    @action(detail=True, methods=["post"])
    def reorder(self, request, pk=None):
        """Update the order of a priority."""
        priority_obj = self.get_object()
        new_order = request.data.get("order")
        
        if new_order is None:
            return error_response("Order is required.", status_code=status.HTTP_400_BAD_REQUEST)
        
        try:
            new_order = int(new_order)
        except (ValueError, TypeError):
            return error_response("Order must be a number.", status_code=status.HTTP_400_BAD_REQUEST)
        
        priority_obj.order = new_order
        priority_obj.save(update_fields=["order"])
        
        return success_response(
            TaskPrioritySerializer(priority_obj, context={"request": request}).data,
            "Priority order updated successfully."
        )
    
    @action(detail=False, methods=["post"])
    def bulk_reorder(self, request):
        """Bulk update order of multiple priorities."""
        orders = request.data.get("orders", [])
        
        if not isinstance(orders, list):
            return error_response("Orders must be a list of {id: order} objects.", status_code=status.HTTP_400_BAD_REQUEST)
        
        tenant_id = get_current_tenant_id(request)
        if not tenant_id:
            return error_response("Tenant not found.", status_code=status.HTTP_400_BAD_REQUEST)
        
        updated = []
        for item in orders:
            priority_id = item.get("id")
            new_order = item.get("order")
            
            if not priority_id or new_order is None:
                continue
            
            try:
                priority_obj = TaskPriority.objects.get(id=priority_id, tenant_id=tenant_id)
                priority_obj.order = int(new_order)
                priority_obj.save(update_fields=["order"])
                updated.append(priority_obj)
            except (TaskPriority.DoesNotExist, ValueError, TypeError):
                continue
        
        return success_response(
            TaskPrioritySerializer(updated, many=True, context={"request": request}).data,
            f"Updated order for {len(updated)} priorit(ies)."
        )
    
    @action(detail=False, methods=["get"])
    def statistics(self, request):
        """Get statistics about priority usage."""
        tenant_id = get_current_tenant_id(request)
        if not tenant_id:
            return error_response("Tenant not found.", status_code=status.HTTP_400_BAD_REQUEST)
        
        priorities = TaskPriority.objects.filter(tenant_id=tenant_id, is_active=True)
        stats = []
        
        for priority_obj in priorities:
            task_count = Task.objects.filter(tenant_id=tenant_id, custom_priority=priority_obj).count()
            stats.append({
                "id": str(priority_obj.id),
                "name": priority_obj.name,
                "slug": priority_obj.slug,
                "task_count": task_count,
            })
        
        return success_response({"statistics": stats})
