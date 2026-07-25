"""
Middleware package for Nittiva API.
"""

from .tenant import TenantMiddleware

__all__ = ["TenantMiddleware"]
