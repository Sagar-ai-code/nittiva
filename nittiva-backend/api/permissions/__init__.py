"""
Permissions package for Nittiva API.

This package contains custom permission classes.
"""

from .custom import IsAdminOrReadOnly, IsSuperUser

__all__ = [
    "IsAdminOrReadOnly",
    "IsSuperUser",
]

