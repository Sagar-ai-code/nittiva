"""
LeaveRequest serializers.
"""
from rest_framework import serializers
from ..models import LeaveRequest
from .user import UserSerializer


class LeaveRequestSerializer(serializers.ModelSerializer):
    requester = UserSerializer(read_only=True)
    approver = UserSerializer(read_only=True)
    approver_id = serializers.PrimaryKeyRelatedField(
        queryset=LeaveRequest._meta.get_field("approver").related_model.objects.all(),
        source="approver",
        write_only=True,
        required=False,
        allow_null=True,
    )
    days_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = LeaveRequest
        fields = [
            "id",
            "requester",
            "approver",
            "approver_id",
            "leave_type",
            "start_date",
            "end_date",
            "days_count",
            "reason",
            "status",
            "approver_comments",
            "decided_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "requester", "approver", "decided_at", "created_at", "updated_at"]

    def validate(self, attrs):
        start = attrs.get("start_date") or getattr(self.instance, "start_date", None)
        end = attrs.get("end_date") or getattr(self.instance, "end_date", None)
        if start and end and end < start:
            raise serializers.ValidationError({"end_date": "end_date must be on or after start_date."})
        return attrs

    def create(self, validated_data):
        request = self.context.get("request")
        tenant_id = getattr(request, "tenant_id", None)
        if not tenant_id:
            raise serializers.ValidationError({"tenant": "Tenant not found."})
        validated_data["tenant_id"] = tenant_id
        validated_data["requester"] = request.user
        return super().create(validated_data)
