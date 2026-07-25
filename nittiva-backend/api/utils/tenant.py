"""
Tenant utility functions for multi-tenant support.
"""

from typing import Optional
from django.db.models import QuerySet, Model
from django.http import HttpRequest

from ..models import Tenant


def get_current_tenant(request: HttpRequest) -> Optional[Tenant]:
    """
    Get the current tenant from request.
    
    Args:
        request: Django HttpRequest object
        
    Returns:
        Tenant object or None
    """
    return getattr(request, 'tenant', None)


def get_current_tenant_id(request: HttpRequest) -> Optional[str]:
    """
    Get the current tenant ID from request.
    
    Args:
        request: Django HttpRequest object
        
    Returns:
        Tenant UUID string or None
    """
    tenant = get_current_tenant(request)
    return str(tenant.id) if tenant else None


def filter_by_tenant(queryset: QuerySet, tenant_id: str) -> QuerySet:
    """
    Filter a queryset by tenant_id.
    
    Args:
        queryset: Django QuerySet
        tenant_id: Tenant UUID string
        
    Returns:
        Filtered QuerySet
    """
    return queryset.filter(tenant_id=tenant_id)


def ensure_tenant_id(model_instance: Model, tenant_id: str) -> None:
    """
    Ensure a model instance has the correct tenant_id set.
    
    Args:
        model_instance: Django model instance
        tenant_id: Tenant UUID string
    """
    if hasattr(model_instance, 'tenant_id'):
        model_instance.tenant_id = tenant_id
