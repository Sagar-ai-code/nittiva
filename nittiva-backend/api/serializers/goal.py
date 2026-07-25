"""
Goal serializers.

This module contains serializers for goal and goal linked entity data.
"""
from rest_framework import serializers
from ..models import Goal, GoalLinkedEntity
from .user import UserSerializer


class GoalLinkedEntitySerializer(serializers.ModelSerializer):
    """Serializer for goal linked entities."""
    
    class Meta:
        model = GoalLinkedEntity
        fields = ["id", "entity_type", "entity_id", "weight", "created_at"]
        read_only_fields = ["id", "created_at"]


class GoalSerializer(serializers.ModelSerializer):
    """Serializer for goals."""
    
    owner = UserSerializer(read_only=True)
    parent_goal = serializers.PrimaryKeyRelatedField(
        queryset=Goal.objects.all(),
        required=False,
        allow_null=True
    )
    linked_entities = GoalLinkedEntitySerializer(many=True, read_only=True)
    child_goals_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Goal
        fields = [
            "id",
            "title",
            "description",
            "status",
            "parent_goal",
            "owner",
            "target_value",
            "current_value",
            "progress_percentage",
            "weight",
            "start_date",
            "target_date",
            "achieved_at",
            "linked_entities",
            "child_goals_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "current_value",
            "progress_percentage",
            "achieved_at",
            "created_at",
            "updated_at",
        ]
    
    def get_child_goals_count(self, obj):
        return obj.child_goals.count()
    
    def create(self, validated_data):
        request = self.context.get("request")
        tenant_id = getattr(request, 'tenant_id', None)
        
        if not tenant_id:
            raise serializers.ValidationError({"tenant": "Tenant not found."})
        
        validated_data["tenant_id"] = tenant_id
        if not validated_data.get("owner"):
            validated_data["owner"] = request.user
        
        return super().create(validated_data)
