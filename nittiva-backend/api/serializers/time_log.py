"""
Time log serializers.

This module contains serializers for time log data.
"""
from rest_framework import serializers
from ..models import TimeLog, Task
from .user import UserSerializer
from .task import TaskSerializer


class TimeLogSerializer(serializers.ModelSerializer):
    """Serializer for time logs."""
    
    user = UserSerializer(read_only=True)
    task = TaskSerializer(read_only=True)
    task_id = serializers.PrimaryKeyRelatedField(
        queryset=Task.objects.none(),  # Placeholder queryset, will be filtered in __init__
        source="task",
        write_only=True,
        required=False,
        allow_null=True
    )
    duration_hours = serializers.SerializerMethodField()
    duration_formatted = serializers.SerializerMethodField()
    
    class Meta:
        model = TimeLog
        fields = [
            "id",
            "task",
            "task_id",
            "user",
            "started_at",
            "ended_at",
            "duration_seconds",
            "duration_hours",
            "duration_formatted",
            "is_manual",
            "description",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "user", "duration_seconds", "created_at", "updated_at"]
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Set task queryset based on request context
        request = self.context.get("request")
        if request:
            from ..utils.tenant import get_current_tenant_id
            tenant_id = get_current_tenant_id(request)
            if tenant_id:
                self.fields['task_id'].queryset = Task.objects.filter(tenant_id=tenant_id)
            else:
                # If no tenant_id, use empty queryset (will fail validation, but prevents errors)
                self.fields['task_id'].queryset = Task.objects.none()
    
    def get_duration_hours(self, obj):
        """Get duration in hours."""
        return round(obj.duration_seconds / 3600, 2)
    
    def get_duration_formatted(self, obj):
        """Get formatted duration string."""
        total_seconds = obj.duration_seconds
        hours = total_seconds // 3600
        minutes = (total_seconds % 3600) // 60
        seconds = total_seconds % 60
        
        if hours > 0:
            return f"{hours}h {minutes}m {seconds}s"
        elif minutes > 0:
            return f"{minutes}m {seconds}s"
        else:
            return f"{seconds}s"
    
    def create(self, validated_data):
        request = self.context.get("request")
        tenant_id = getattr(request, 'tenant_id', None)
        
        if not tenant_id:
            raise serializers.ValidationError({"tenant": "Tenant not found."})
        
        validated_data["tenant_id"] = tenant_id
        validated_data["user"] = request.user
        
        # Calculate duration if ended_at is provided
        if validated_data.get("ended_at") and validated_data.get("started_at"):
            from datetime import timedelta
            delta = validated_data["ended_at"] - validated_data["started_at"]
            validated_data["duration_seconds"] = int(delta.total_seconds())
        
        return super().create(validated_data)
