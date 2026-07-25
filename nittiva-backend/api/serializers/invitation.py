"""
Invitation serializers.

This module contains serializers for project invitations.
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model

from ..models import Invitation, Project
from .user import UserSerializer

User = get_user_model()


class InvitationSerializer(serializers.ModelSerializer):
    """Serializer for invitation data."""
    
    invited_by = UserSerializer(read_only=True)
    invited_user = UserSerializer(read_only=True)
    project_name = serializers.CharField(source="project.name", read_only=True)
    
    class Meta:
        model = Invitation
        fields = [
            "id",
            "token",
            "project",
            "project_name",
            "email",
            "invited_by",
            "invited_user",
            "role",
            "status",
            "message",
            "expires_at",
            "accepted_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "token",
            "invited_by",
            "invited_user",
            "status",
            "accepted_at",
            "created_at",
            "updated_at",
        ]
    
    def validate(self, attrs):
        """Validate invitation data."""
        # Check if user is already a project member
        project = attrs.get("project")
        email = attrs.get("email")
        
        if project and email:
            # Check if user exists and is already a member
            try:
                user = User.objects.get(email=email, tenant_id=project.tenant_id)
                if project.members.filter(id=user.id).exists():
                    raise serializers.ValidationError({
                        "email": "User is already a member of this project."
                    })
            except User.DoesNotExist:
                pass  # New user, that's fine
            
            # Check for pending invitation
            if Invitation.objects.filter(
                project=project,
                email=email,
                status=Invitation.Status.PENDING
            ).exists():
                raise serializers.ValidationError({
                    "email": "A pending invitation already exists for this email."
                })
        
        return attrs


class CreateInvitationSerializer(serializers.Serializer):
    """Serializer for creating invitations."""
    
    email = serializers.EmailField(required=True)
    role = serializers.ChoiceField(
        choices=Invitation.Role.choices,
        default=Invitation.Role.MEMBER
    )
    message = serializers.CharField(required=False, allow_blank=True)


class AcceptInvitationSerializer(serializers.Serializer):
    """Serializer for accepting invitations."""
    
    token = serializers.CharField(required=True)
