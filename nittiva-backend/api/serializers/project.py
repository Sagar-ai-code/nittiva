"""
Project serializers.

This module contains serializers for project and project member data.
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.db import transaction

from ..models import Project, ProjectMember
from .user import UserSerializer

User = get_user_model()


class ProjectMemberSerializer(serializers.ModelSerializer):
    """Serializer for project member data."""

    user = UserSerializer(read_only=True)
    user_id = serializers.PrimaryKeyRelatedField(
        source="user", queryset=User.objects.all(), write_only=True
    )

    class Meta:
        model = ProjectMember
        fields = ["id", "user", "user_id", "role", "joined_at"]


class ProjectSerializer(serializers.ModelSerializer):
    """Serializer for project data."""

    owner = UserSerializer(read_only=True)  # show owner info
    members = UserSerializer(many=True, read_only=True)  # read: expanded members
    member_ids = serializers.ListField(  # write: list of user IDs
        child=serializers.IntegerField(),
        write_only=True,
        required=False
    )

    class Meta:
        model = Project
        fields = [
            "id",
            "name",
            "description",
            "color",
            "status",
            "owner",
            "members",
            "member_ids",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ("id", "owner", "created_at", "updated_at")

    def create(self, validated_data):
        """Create a new project with members and tenant."""
        request = self.context.get("request")
        member_ids = validated_data.pop("member_ids", [])
        
        # Get tenant_id from request (set by middleware)
        tenant_id = None
        if hasattr(request, 'tenant_id'):
            tenant_id = request.tenant_id
        elif hasattr(request, 'tenant') and request.tenant:
            tenant_id = request.tenant.id
        
        # Fallback: Use user's tenant_id if middleware didn't set it
        if not tenant_id and hasattr(request, 'user') and request.user.is_authenticated:
            user = request.user
            if hasattr(user, 'tenant_id') and user.tenant_id:
                tenant_id = user.tenant_id
        
        if not tenant_id:
            raise serializers.ValidationError({"tenant": "Tenant not found. Please ensure you're accessing via correct subdomain or that your account is associated with a tenant."})
        
        with transaction.atomic():
            project = Project.objects.create(
                owner=request.user,
                tenant_id=tenant_id,
                **validated_data
            )

            # Ensure creator is an admin member
            ProjectMember.objects.get_or_create(
                project=project,
                user=request.user,
                defaults={"role": "admin", "tenant_id": tenant_id}
            )

            if member_ids:
                users = User.objects.filter(id__in=member_ids, tenant_id=tenant_id).distinct()
                for u in users:
                    ProjectMember.objects.get_or_create(
                        project=project,
                        user=u,
                        defaults={"role": "member", "tenant_id": tenant_id}
                    )
        return project

    def update(self, instance, validated_data):
        """Update project and manage members."""
        member_ids = validated_data.pop("member_ids", None)

        for attr, val in validated_data.items():
            setattr(instance, attr, val)

        with transaction.atomic():
            instance.save()

            if member_ids is not None:
                # Always keep owner; set the rest to provided list
                keep_ids = set(member_ids)
                if instance.owner_id:
                    keep_ids.add(instance.owner_id)

                # Remove those not in keep_ids
                ProjectMember.objects.filter(project=instance).exclude(
                    user_id__in=keep_ids
                ).delete()

                # Ensure all keep_ids exist (owner admin, others member)
                for uid in keep_ids:
                    defaults = {"role": "member"}
                    if uid == instance.owner_id:
                        defaults["role"] = "admin"
                    ProjectMember.objects.get_or_create(
                        project=instance, user_id=uid, defaults=defaults
                    )
        return instance

