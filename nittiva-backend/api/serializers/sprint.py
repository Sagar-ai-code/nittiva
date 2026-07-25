"""
Sprint serializers.

This module contains serializers for Sprint and SprintMember models.
"""

from rest_framework import serializers
from ..models import Sprint, SprintMember, Task, Project, User
from ..utils.tenant import get_current_tenant_id


class SprintMemberSerializer(serializers.ModelSerializer):
    """Serializer for SprintMember model."""

    user_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.none(), source="user", write_only=True, required=False
    )
    user_email = serializers.EmailField(source="user.email", read_only=True)
    user_name = serializers.CharField(source="user.name", read_only=True)

    class Meta:
        model = SprintMember
        fields = [
            "id",
            "sprint",
            "user_id",
            "user_email",
            "user_name",
            "role",
            "joined_at",
        ]
        read_only_fields = ["id", "joined_at"]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get("request")
        if request:
            from ..models import User
            tenant_id = get_current_tenant_id(request)
            if tenant_id:
                # Set queryset in __init__ to avoid AssertionError
                self.fields["user_id"].queryset = User.objects.filter(tenant_id=tenant_id)
            else:
                self.fields["user_id"].queryset = User.objects.none()
        else:
            # Fallback: use empty queryset if no request context
            from ..models import User
            self.fields["user_id"].queryset = User.objects.none()


class SprintSerializer(serializers.ModelSerializer):
    """Serializer for Sprint model."""

    project_id = serializers.PrimaryKeyRelatedField(
        queryset=Project.objects.none(), source="project", write_only=True
    )
    project_name = serializers.CharField(source="project.name", read_only=True)
    created_by_email = serializers.EmailField(source="created_by.email", read_only=True)
    created_by_name = serializers.CharField(source="created_by.name", read_only=True)

    # Computed fields
    duration_days = serializers.IntegerField(read_only=True)
    task_count = serializers.SerializerMethodField()
    completed_task_count = serializers.SerializerMethodField()
    total_story_points = serializers.SerializerMethodField()
    completed_story_points = serializers.SerializerMethodField()
    progress_percentage = serializers.SerializerMethodField()

    # Members
    members = SprintMemberSerializer(many=True, read_only=True)

    class Meta:
        model = Sprint
        fields = [
            "id",
            "project_id",
            "project_name",
            "name",
            "goal",
            "description",
            "start_date",
            "end_date",
            "status",
            "velocity_target",
            "actual_velocity",
            "retrospective_notes",
            "what_went_well",
            "what_to_improve",
            "action_items",
            "created_by",
            "created_by_email",
            "created_by_name",
            "created_at",
            "updated_at",
            "duration_days",
            "task_count",
            "completed_task_count",
            "total_story_points",
            "completed_story_points",
            "progress_percentage",
            "members",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
            "created_by",
            "duration_days",
            "task_count",
            "completed_task_count",
            "total_story_points",
            "completed_story_points",
            "progress_percentage",
        ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get("request")
        if request:
            tenant_id = get_current_tenant_id(request)
            if tenant_id:
                self.fields["project_id"].queryset = Project.objects.filter(tenant_id=tenant_id)
            else:
                self.fields["project_id"].queryset = Project.objects.none()

    def get_task_count(self, obj):
        """Get total number of tasks in this sprint."""
        return obj.tasks.filter(tenant_id=obj.tenant_id).count()

    def get_completed_task_count(self, obj):
        """Get number of completed tasks in this sprint."""
        return obj.tasks.filter(tenant_id=obj.tenant_id, status=Task.Status.COMPLETED).count()

    def get_total_story_points(self, obj):
        """Get total story points in this sprint."""
        tasks = obj.tasks.filter(tenant_id=obj.tenant_id)
        return sum(task.story_points or 0 for task in tasks)

    def get_completed_story_points(self, obj):
        """Get completed story points in this sprint."""
        tasks = obj.tasks.filter(tenant_id=obj.tenant_id, status=Task.Status.COMPLETED)
        return sum(task.story_points or 0 for task in tasks)

    def get_progress_percentage(self, obj):
        """Calculate progress percentage based on completed tasks."""
        total_tasks = self.get_task_count(obj)
        if total_tasks == 0:
            return 0
        completed_tasks = self.get_completed_task_count(obj)
        return round((completed_tasks / total_tasks) * 100, 2)

    def create(self, validated_data):
        """Create a new sprint with tenant_id and created_by."""
        request = self.context.get("request")
        if request and request.user:
            validated_data["created_by"] = request.user
        validated_data["tenant_id"] = get_current_tenant_id(request)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        """Update sprint and recalculate velocity if needed."""
        instance = super().update(instance, validated_data)
        # Recalculate velocity if tasks changed
        instance.calculate_velocity()
        return instance


class SprintDetailSerializer(SprintSerializer):
    """Extended serializer for sprint detail view with task information."""

    tasks = serializers.SerializerMethodField()

    class Meta(SprintSerializer.Meta):
        fields = SprintSerializer.Meta.fields + ["tasks"]

    def get_tasks(self, obj):
        """Get all tasks in this sprint."""
        # Import here to avoid circular dependency
        from ..serializers.task import TaskSerializer

        tasks = obj.tasks.filter(tenant_id=obj.tenant_id).order_by("status", "priority", "-created_at")
        serializer = TaskSerializer(tasks, many=True, context=self.context)
        return serializer.data


class SprintSummarySerializer(serializers.ModelSerializer):
    """Lightweight serializer for sprint lists and summaries."""

    project_name = serializers.CharField(source="project.name", read_only=True)
    task_count = serializers.SerializerMethodField()
    completed_task_count = serializers.SerializerMethodField()
    total_story_points = serializers.SerializerMethodField()
    progress_percentage = serializers.SerializerMethodField()

    class Meta:
        model = Sprint
        fields = [
            "id",
            "name",
            "project_name",
            "start_date",
            "end_date",
            "status",
            "velocity_target",
            "actual_velocity",
            "task_count",
            "completed_task_count",
            "total_story_points",
            "progress_percentage",
            "created_at",
        ]

    def get_task_count(self, obj):
        """Get total number of tasks in this sprint."""
        return obj.tasks.filter(tenant_id=obj.tenant_id).count()

    def get_completed_task_count(self, obj):
        """Get number of completed tasks in this sprint."""
        return obj.tasks.filter(tenant_id=obj.tenant_id, status=Task.Status.COMPLETED).count()

    def get_total_story_points(self, obj):
        """Get total story points in this sprint."""
        tasks = obj.tasks.filter(tenant_id=obj.tenant_id)
        return sum(task.story_points or 0 for task in tasks)

    def get_progress_percentage(self, obj):
        """Calculate progress percentage based on completed tasks."""
        total_tasks = self.get_task_count(obj)
        if total_tasks == 0:
            return 0
        completed_tasks = self.get_completed_task_count(obj)
        return round((completed_tasks / total_tasks) * 100, 2)
