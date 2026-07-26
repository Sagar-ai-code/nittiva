"""
LeaveRequest views.
"""
from rest_framework import viewsets, permissions
from rest_framework.exceptions import ValidationError, PermissionDenied
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone

from ..models import LeaveRequest
from ..serializers import LeaveRequestSerializer
from ..utils.tenant import get_current_tenant_id


class LeaveRequestViewSet(viewsets.ModelViewSet):
    """ViewSet for leave-request CRUD with approve/reject/cancel actions.

    Permissions:
      - List/retrieve: any user in the tenant (see their own + others', if a manager)
      - Create: any authenticated user (creates a request for themselves)
      - Approve/reject: only managers/superusers
      - Cancel: only the requester, and only while pending
    """

    serializer_class = LeaveRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        tenant_id = get_current_tenant_id(self.request)
        if not tenant_id:
            raise ValidationError("Tenant not found.")

        qs = LeaveRequest.objects.filter(tenant_id=tenant_id)

        status_param = self.request.query_params.get("status")
        if status_param:
            qs = qs.filter(status=status_param)

        leave_type = self.request.query_params.get("leave_type")
        if leave_type:
            qs = qs.filter(leave_type=leave_type)

        # Default scoping: users see their own requests; managers see all in tenant.
        user = self.request.user
        is_manager = getattr(user, "role", None) in {"manager", "admin"} or user.is_superuser or user.is_staff
        if not is_manager and self.action == "list":
            qs = qs.filter(requester=user)

        # `?requester=me` or `?requester=<user_id>` explicit filter
        requester = self.request.query_params.get("requester")
        if requester == "me":
            qs = qs.filter(requester=user)
        elif requester:
            qs = qs.filter(requester_id=requester)

        return qs

    def perform_create(self, serializer):
        tenant_id = get_current_tenant_id(self.request)
        if not tenant_id:
            raise ValidationError("Tenant not found.")
        serializer.save(tenant_id=tenant_id)

    def _is_manager(self, user):
        return (
            getattr(user, "role", None) in {"manager", "admin"}
            or user.is_superuser
            or user.is_staff
        )

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        if not self._is_manager(request.user):
            raise PermissionDenied("Only managers can approve leave requests.")
        leave = self.get_object()
        if leave.status != "pending":
            return Response(
                {"detail": f"Cannot approve a request in status '{leave.status}'."},
                status=400,
            )
        leave.status = "approved"
        leave.approver = request.user
        leave.approver_comments = request.data.get("comments", "")
        leave.decided_at = timezone.now()
        leave.save()
        return Response(self.get_serializer(leave).data)

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        if not self._is_manager(request.user):
            raise PermissionDenied("Only managers can reject leave requests.")
        leave = self.get_object()
        if leave.status != "pending":
            return Response(
                {"detail": f"Cannot reject a request in status '{leave.status}'."},
                status=400,
            )
        leave.status = "rejected"
        leave.approver = request.user
        leave.approver_comments = request.data.get("comments", "")
        leave.decided_at = timezone.now()
        leave.save()
        return Response(self.get_serializer(leave).data)

    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        leave = self.get_object()
        if leave.requester_id != request.user.id:
            raise PermissionDenied("Only the requester can cancel their own leave request.")
        if leave.status != "pending":
            return Response(
                {"detail": f"Cannot cancel a request in status '{leave.status}'."},
                status=400,
            )
        leave.status = "cancelled"
        leave.save()
        return Response(self.get_serializer(leave).data)
