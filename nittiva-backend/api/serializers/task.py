"""
Task serializers.

This module contains serializers for task and task assignment data.
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.db import transaction

from ..models import Task, TaskAssignment, Project, TaskStatus, TaskPriority
from .user import UserSerializer
from .task_status import TaskStatusSerializer, TaskPrioritySerializer

User = get_user_model()


class TaskAssignmentSerializer(serializers.ModelSerializer):
    """Serializer for task assignment data."""

    user = UserSerializer(read_only=True)
    user_id = serializers.PrimaryKeyRelatedField(
        source="user", queryset=User.objects.all(), write_only=True
    )

    class Meta:
        model = TaskAssignment
        fields = ["id", "user", "user_id", "assigned_at"]


class TaskSerializer(serializers.ModelSerializer):
    """Serializer for task data."""

    project = serializers.PrimaryKeyRelatedField(
        queryset=Project.objects.all(),
        required=False,
        allow_null=True
    )
    assignees = UserSerializer(many=True, read_only=True)  # read: expanded users
    parent = serializers.PrimaryKeyRelatedField(
        queryset=Task.objects.all(),
        required=False,
        allow_null=True
    )
    children = serializers.SerializerMethodField()
    children_count = serializers.SerializerMethodField()

    # write: list of user IDs
    assignee_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False
    )

    created_by = UserSerializer(read_only=True)
    updated_by = UserSerializer(read_only=True)
    
    # Custom status and priority
    custom_status = TaskStatusSerializer(read_only=True)
    custom_status_id = serializers.PrimaryKeyRelatedField(
        queryset=TaskStatus.objects.none(),
        source="custom_status",
        write_only=True,
        required=False,
        allow_null=True
    )
    custom_priority = TaskPrioritySerializer(read_only=True)
    custom_priority_id = serializers.PrimaryKeyRelatedField(
        queryset=TaskPriority.objects.none(),
        source="custom_priority",
        write_only=True,
        required=False,
        allow_null=True
    )
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get("request")
        if request:
            from ..utils.tenant import get_current_tenant_id
            tenant_id = get_current_tenant_id(request)
            if tenant_id:
                self.fields["custom_status_id"].queryset = TaskStatus.objects.filter(tenant_id=tenant_id)
                self.fields["custom_priority_id"].queryset = TaskPriority.objects.filter(tenant_id=tenant_id)

    class Meta:
        model = Task
        fields = [
            "id",
            "work_item_type",
            "project",
            "parent",
            "children",
            "children_count",
            "sprint",  # Sprint FK
            "title",
            "description",
            "status",
            "priority",
            "custom_status",
            "custom_status_id",
            "custom_priority",
            "custom_priority_id",
            "story_points",
            "progress",
            "due_date",
            "time_tracked_seconds",
            "custom_fields",
            "assignees",  # read
            "assignee_ids",  # write
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "assignees",
            "children",
            "children_count",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
            "time_tracked_seconds",
        ]
    
    def get_children(self, obj):
        """Get child tasks."""
        children = obj.children.filter(tenant_id=obj.tenant_id).order_by("created_at")
        return TaskSerializer(children, many=True).data
    
    def get_children_count(self, obj):
        """Get count of child tasks."""
        return obj.children.filter(tenant_id=obj.tenant_id).count()

    def _set_audit_fields(self, instance, *, creating: bool):
        """Set audit fields (created_by, updated_by)."""
        request = self.context.get("request")
        user = getattr(request, "user", None)
        if creating:
            instance.created_by = user
        instance.updated_by = user

    def _set_assignees(self, task: Task, assignee_ids):
        """Set task assignees and ensure they're project members."""
        if assignee_ids is None:
            return
        # Filter users by tenant_id to ensure they belong to the same tenant
        tenant_id = task.tenant_id
        users = User.objects.filter(id__in=assignee_ids, tenant_id=tenant_id).distinct()
        task.assignees.set(users)
        
        # Update TaskAssignment tenant_id
        for assignment in task.assignments.all():
            assignment.tenant_id = tenant_id
            assignment.save()
        
        # Ensure all assignees are project members (so they can see the project)
        if task.project:
            from ..models import ProjectMember
            for user in users:
                ProjectMember.objects.get_or_create(
                    project=task.project,
                    user=user,
                    defaults={"role": "member", "tenant_id": tenant_id}
                )

    def create(self, validated_data):
        """Create a new task with assignees and tenant."""
        assignee_ids = validated_data.pop("assignee_ids", [])
        request = self.context.get("request")
        
        # Get tenant_id from request (set by middleware)
        tenant_id = None
        if hasattr(request, 'tenant_id'):
            tenant_id = request.tenant_id
        elif hasattr(request, 'tenant') and request.tenant:
            tenant_id = request.tenant.id
        
        if not tenant_id:
            raise serializers.ValidationError({"tenant": "Tenant not found. Please ensure you're accessing via correct subdomain."})
        
        with transaction.atomic():
            task = Task(tenant_id=tenant_id, **validated_data)
            self._set_audit_fields(task, creating=True)
            task.save()
            self._set_assignees(task, assignee_ids)
            
            # Ensure TaskAssignments have tenant_id
            if assignee_ids:
                for assignment in task.assignments.all():
                    assignment.tenant_id = tenant_id
                    assignment.save()
        return task

    def update(self, instance, validated_data):
        """Update task and manage assignees."""
        assignee_ids = validated_data.pop("assignee_ids", None)

        for attr, val in validated_data.items():
            setattr(instance, attr, val)

        with transaction.atomic():
            self._set_audit_fields(instance, creating=False)
            instance.save()
            self._set_assignees(instance, assignee_ids)
        return instance

