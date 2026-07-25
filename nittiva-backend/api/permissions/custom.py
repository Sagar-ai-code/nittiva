"""
Custom permission classes.

This module contains custom permission classes for API access control.
"""

from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsAdminOrReadOnly(BasePermission):
    """
    Permission class that allows read-only access to all users,
    but write access only to staff/admin users.
    """

    def has_permission(self, request, view):
        """Check if user has permission for the request."""
        if request.method in SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_staff)


class IsSuperUser(BasePermission):
    """
    Permission class that only allows superusers.
    Used for sensitive operations like tenant management.
    """

    def has_permission(self, request, view):
        """Check if user is a superuser."""
        return bool(request.user and request.user.is_authenticated and request.user.is_superuser)
