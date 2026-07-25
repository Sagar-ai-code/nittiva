"""
Password reset serializers.

This module contains serializers for password reset functionality.
"""

from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password


class PasswordResetRequestSerializer(serializers.Serializer):
    """Serializer for password reset request (forgot password)."""

    email = serializers.EmailField(required=True)


class PasswordResetSerializer(serializers.Serializer):
    """Serializer for password reset (with token)."""

    email = serializers.EmailField(required=True)
    token = serializers.CharField(required=True)
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirmation = serializers.CharField(write_only=True, required=True)

    def validate(self, attrs):
        """Validate that passwords match."""
        if attrs.get("password") != attrs.get("password_confirmation"):
            raise serializers.ValidationError(
                {"password_confirmation": "Passwords do not match"}
            )
        return attrs


