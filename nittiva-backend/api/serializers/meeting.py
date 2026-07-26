"""
Meeting serializers.
"""
from rest_framework import serializers
from ..models import Meeting
from .user import UserSerializer


class MeetingSerializer(serializers.ModelSerializer):
    """Serializer for meetings."""

    organizer = UserSerializer(read_only=True)
    participants = UserSerializer(many=True, read_only=True)
    participant_ids = serializers.ListField(
        child=serializers.UUIDField(),
        write_only=True,
        required=False,
        default=list,
    )

    class Meta:
        model = Meeting
        fields = [
            "id",
            "title",
            "description",
            "location",
            "meeting_url",
            "start_time",
            "end_time",
            "organizer",
            "participants",
            "participant_ids",
            "project_id",
            "status",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "organizer", "created_at", "updated_at"]

    def validate(self, attrs):
        start = attrs.get("start_time") or getattr(self.instance, "start_time", None)
        end = attrs.get("end_time") or getattr(self.instance, "end_time", None)
        if start and end and end <= start:
            raise serializers.ValidationError({"end_time": "end_time must be after start_time."})
        return attrs

    def create(self, validated_data):
        participant_ids = validated_data.pop("participant_ids", [])
        request = self.context.get("request")
        tenant_id = getattr(request, "tenant_id", None)
        if not tenant_id:
            raise serializers.ValidationError({"tenant": "Tenant not found."})
        validated_data["tenant_id"] = tenant_id
        validated_data["organizer"] = request.user
        meeting = super().create(validated_data)
        if participant_ids:
            meeting.participants.set(participant_ids)
        return meeting

    def update(self, instance, validated_data):
        participant_ids = validated_data.pop("participant_ids", None)
        meeting = super().update(instance, validated_data)
        if participant_ids is not None:
            meeting.participants.set(participant_ids)
        return meeting
