"""
Invitation views.

This module contains views for project invitations.
"""

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError, NotFound

from ..models import Invitation, Project, ProjectMember
from ..serializers import InvitationSerializer, CreateInvitationSerializer, AcceptInvitationSerializer
from ..utils.responses import success_response, error_response
from ..utils.tenant import get_current_tenant_id

User = get_user_model()


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def invite_user_to_project(request, project_id):
    """
    Invite a user to a project.
    
    POST /api/projects/{id}/invite
    Body: {
        "email": "user@example.com",
        "role": "member",  // admin, member, viewer
        "message": "Optional message"
    }
    """
    try:
        tenant_id = get_current_tenant_id(request)
        if not tenant_id:
            return error_response(
                message="Tenant not found.",
                status_code=status.HTTP_400_BAD_REQUEST,
            )
        
        # Get project and verify user has permission
        try:
            project = Project.objects.get(id=project_id, tenant_id=tenant_id)
        except Project.DoesNotExist:
            return error_response(
                message="Project not found.",
                status_code=status.HTTP_404_NOT_FOUND,
            )
        
        # Check if user is project admin or owner
        is_owner = project.owner_id == request.user.id
        is_admin = ProjectMember.objects.filter(
            project=project,
            user=request.user,
            role=ProjectMember.Role.ADMIN,
            tenant_id=tenant_id
        ).exists()
        
        if not (is_owner or is_admin or request.user.is_staff):
            return error_response(
                message="You don't have permission to invite users to this project.",
                status_code=status.HTTP_403_FORBIDDEN,
            )
        
        # Validate invitation data
        serializer = CreateInvitationSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                message="Invalid invitation data",
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST,
            )
        
        email = serializer.validated_data["email"]
        role = serializer.validated_data.get("role", Invitation.Role.MEMBER)
        message = serializer.validated_data.get("message", "")
        
        # Check if user exists in tenant
        invited_user = None
        try:
            invited_user = User.objects.get(email=email, tenant_id=tenant_id)
        except User.DoesNotExist:
            pass  # New user, will register first
        
        # Create invitation
        invitation = Invitation.objects.create(
            project=project,
            email=email,
            invited_by=request.user,
            invited_user=invited_user,
            role=role,
            message=message,
            tenant_id=tenant_id,
        )
        
        # TODO: Send invitation email
        # For now, just return the invitation with token
        # In production, send email with link: /accept-invite?token={invitation.token}
        
        return success_response(
            data=InvitationSerializer(invitation).data,
            message=f"Invitation sent to {email}",
            status_code=status.HTTP_201_CREATED,
        )
    
    except Exception as e:
        return error_response(
            message=f"Failed to create invitation: {str(e)}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def list_project_invitations(request, project_id):
    """
    List all invitations for a project.
    
    GET /api/projects/{id}/invitations
    """
    try:
        tenant_id = get_current_tenant_id(request)
        if not tenant_id:
            return error_response(
                message="Tenant not found.",
                status_code=status.HTTP_400_BAD_REQUEST,
            )
        
        # Get project and verify access
        try:
            project = Project.objects.get(id=project_id, tenant_id=tenant_id)
        except Project.DoesNotExist:
            return error_response(
                message="Project not found.",
                status_code=status.HTTP_404_NOT_FOUND,
            )
        
        # Check permission
        is_owner = project.owner_id == request.user.id
        is_admin = ProjectMember.objects.filter(
            project=project,
            user=request.user,
            role=ProjectMember.Role.ADMIN,
            tenant_id=tenant_id
        ).exists()
        
        if not (is_owner or is_admin or request.user.is_staff):
            return error_response(
                message="You don't have permission to view invitations.",
                status_code=status.HTTP_403_FORBIDDEN,
            )
        
        invitations = Invitation.objects.filter(
            project=project,
            tenant_id=tenant_id
        ).order_by("-created_at")
        
        # Update expired invitations
        for inv in invitations:
            if inv.is_expired() and inv.status == Invitation.Status.PENDING:
                inv.status = Invitation.Status.EXPIRED
                inv.save()
        
        return success_response(
            data=InvitationSerializer(invitations, many=True).data,
            message="Invitations retrieved successfully",
        )
    
    except Exception as e:
        return error_response(
            message=f"Failed to retrieve invitations: {str(e)}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def accept_invitation(request):
    """
    Accept a project invitation.
    
    POST /api/invitations/accept
    Body: {
        "token": "invitation-token"
    }
    
    If user is not authenticated, they need to register first.
    """
    try:
        serializer = AcceptInvitationSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                message="Invalid token",
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST,
            )
        
        token = serializer.validated_data["token"]
        
        # Get invitation
        try:
            invitation = Invitation.objects.get(token=token)
        except Invitation.DoesNotExist:
            return error_response(
                message="Invalid invitation token.",
                status_code=status.HTTP_404_NOT_FOUND,
            )
        
        # Check if invitation can be accepted
        if not invitation.can_be_accepted():
            if invitation.is_expired():
                return error_response(
                    message="This invitation has expired.",
                    status_code=status.HTTP_400_BAD_REQUEST,
                )
            return error_response(
                message="This invitation has already been used.",
                status_code=status.HTTP_400_BAD_REQUEST,
            )
        
        # If user is authenticated, accept immediately
        if request.user.is_authenticated:
            # Verify user email matches invitation email
            if request.user.email.lower() != invitation.email.lower():
                return error_response(
                    message="This invitation was sent to a different email address.",
                    status_code=status.HTTP_403_FORBIDDEN,
                )
            
            # Verify user belongs to same tenant
            if str(request.user.tenant_id) != str(invitation.tenant_id):
                return error_response(
                    message="You cannot accept invitations from other tenants.",
                    status_code=status.HTTP_403_FORBIDDEN,
                )
            
            # Accept invitation
            invitation.accept(user=request.user)
            
            return success_response(
                data={
                    "invitation": InvitationSerializer(invitation).data,
                    "project": {
                        "id": invitation.project.id,
                        "name": invitation.project.name,
                    }
                },
                message="Invitation accepted successfully. You've been added to the project.",
                status_code=status.HTTP_200_OK,
            )
        else:
            # User not authenticated - return invitation details for registration
            return success_response(
                data={
                    "invitation": InvitationSerializer(invitation).data,
                    "requires_registration": True,
                    "message": "Please register or login to accept this invitation."
                },
                message="Invitation found. Please register or login to accept.",
                status_code=status.HTTP_200_OK,
            )
    
    except Exception as e:
        return error_response(
            message=f"Failed to accept invitation: {str(e)}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def get_invitation_by_token(request, token):
    """
    Get invitation details by token (for accept page).
    
    GET /api/invitations/{token}
    """
    try:
        invitation = Invitation.objects.get(token=token)
        
        # Check if expired
        if invitation.is_expired() and invitation.status == Invitation.Status.PENDING:
            invitation.status = Invitation.Status.EXPIRED
            invitation.save()
        
        return success_response(
            data=InvitationSerializer(invitation).data,
            message="Invitation retrieved successfully",
        )
    
    except Invitation.DoesNotExist:
        return error_response(
            message="Invitation not found.",
            status_code=status.HTTP_404_NOT_FOUND,
        )
