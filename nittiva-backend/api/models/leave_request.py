"""
LeaveRequest model.

Tracks employee/agent leave requests (vacation, sick, personal, etc.)
with an approval workflow.
"""
import uuid
from django.db import models
from django.conf import settings


class LeaveRequest(models.Model):
    """A leave / time-off request submitted by a user, pending approval."""

    LEAVE_TYPES = [
        ("annual", "Annual Leave"),
        ("sick", "Sick Leave"),
        ("personal", "Personal"),
        ("maternity", "Maternity / Paternity"),
        ("emergency", "Emergency"),
        ("unpaid", "Unpaid Leave"),
    ]
    STATUS = [
        ("pending", "Pending"),
        ("approved", "Approved"),
        ("rejected", "Rejected"),
        ("cancelled", "Cancelled"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Multi-tenant
    tenant_id = models.UUIDField(null=True, blank=True, db_index=True)

    # Requester + (optional) approver
    requester = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="leave_requests",
    )
    approver = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="approved_leave_requests",
    )

    # Request details
    leave_type = models.CharField(max_length=20, choices=LEAVE_TYPES, default="annual")
    start_date = models.DateField()
    end_date = models.DateField()
    reason = models.TextField(blank=True, default="")

    # Status
    status = models.CharField(max_length=20, choices=STATUS, default="pending")
    approver_comments = models.TextField(blank=True, default="")
    decided_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "leave_requests"
        indexes = [
            models.Index(fields=["tenant_id", "status"]),
            models.Index(fields=["tenant_id", "requester"]),
            models.Index(fields=["tenant_id", "start_date"]),
        ]
        ordering = ["-created_at"]

    def __str__(self):
        return f"LeaveRequest({self.requester_id} {self.leave_type} {self.start_date}→{self.end_date} {self.status})"

    @property
    def days_count(self) -> int:
        """Number of calendar days in the request (inclusive of both endpoints)."""
        if not self.start_date or not self.end_date:
            return 0
        return (self.end_date - self.start_date).days + 1
