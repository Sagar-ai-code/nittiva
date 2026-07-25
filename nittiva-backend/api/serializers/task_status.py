"""
Task Status and Priority serializers.

This module contains serializers for TaskStatus and TaskPriority models.
"""

from rest_framework import serializers
from ..models import TaskStatus, TaskPriority, Task
from ..utils.tenant import get_current_tenant_id


class TaskStatusSerializer(serializers.ModelSerializer):
    """Serializer for TaskStatus model."""
    
    task_count = serializers.SerializerMethodField()
    
    class Meta:
        model = TaskStatus
        fields = [
            "id",
            "name",
            "slug",
            "color",
            "icon",
            "order",
            "is_default",
            "is_final",
            "description",
            "is_active",
            "task_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "task_count"]
    
    def get_task_count(self, obj):
        """Get count of tasks using this status."""
        if not obj.tenant_id:
            return 0
        return Task.objects.filter(
            tenant_id=obj.tenant_id,
            custom_status=obj
        ).count()
    
    def create(self, validated_data):
        """Create a new TaskStatus with tenant_id from request."""
        request = self.context.get("request")
        tenant_id = get_current_tenant_id(request)
        if not tenant_id:
            raise serializers.ValidationError({"tenant": "Tenant not found."})
        validated_data["tenant_id"] = tenant_id
        return super().create(validated_data)
    
    def validate_slug(self, value):
        """Ensure slug is unique within tenant."""
        request = self.context.get("request")
        tenant_id = get_current_tenant_id(request)
        if tenant_id:
            existing = TaskStatus.objects.filter(tenant_id=tenant_id, slug=value)
            if self.instance:
                existing = existing.exclude(pk=self.instance.pk)
            if existing.exists():
                raise serializers.ValidationError("A status with this slug already exists for your organization.")
        return value


class TaskPrioritySerializer(serializers.ModelSerializer):
    """Serializer for TaskPriority model."""
    
    task_count = serializers.SerializerMethodField()
    
    class Meta:
        model = TaskPriority
        fields = [
            "id",
            "name",
            "slug",
            "color",
            "icon",
            "order",
            "weight",
            "description",
            "is_active",
            "task_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "task_count"]
    
    def get_task_count(self, obj):
        """Get count of tasks using this priority."""
        if not obj.tenant_id:
            return 0
        return Task.objects.filter(
            tenant_id=obj.tenant_id,
            custom_priority=obj
        ).count()
    
    def create(self, validated_data):
        """Create a new TaskPriority with tenant_id from request."""
        request = self.context.get("request")
        tenant_id = get_current_tenant_id(request)
        if not tenant_id:
            raise serializers.ValidationError({"tenant": "Tenant not found."})
        validated_data["tenant_id"] = tenant_id
        return super().create(validated_data)
    
    def validate_slug(self, value):
        """Ensure slug is unique within tenant."""
        request = self.context.get("request")
        tenant_id = get_current_tenant_id(request)
        if tenant_id:
            existing = TaskPriority.objects.filter(tenant_id=tenant_id, slug=value)
            if self.instance:
                existing = existing.exclude(pk=self.instance.pk)
            if existing.exists():
                raise serializers.ValidationError("A priority with this slug already exists for your organization.")
        return value
