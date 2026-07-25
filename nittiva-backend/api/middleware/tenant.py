"""
Tenant middleware for multi-tenant support.

This middleware resolves the tenant from the company_id and attaches it to the request.
"""

from django.http import Http404
from django.utils.deprecation import MiddlewareMixin
import json

from ..models import Tenant


class TenantMiddleware(MiddlewareMixin):
    """
    Middleware to resolve tenant from company_id.
    
    Priority order:
    1. X-Company-ID header (primary method)
    2. company_id in request body (for POST/PUT/PATCH)
    3. company_id query parameter
    4. Subdomain (backward compatibility)
    """
    
    def process_request(self, request):
        """Resolve tenant from company_id and attach to request."""
        tenant = None
        company_id = None
        
        # Method 1: Get company_id from X-Company-ID header (PRIORITY)
        company_id = request.headers.get("X-Company-ID") or request.headers.get("Company-ID")
        
        # Method 2: Get from request body (for registration/login)
        if not company_id and request.method in ['POST', 'PUT', 'PATCH']:
            try:
                if hasattr(request, 'body') and request.body:
                    # Try to parse JSON body
                    try:
                        body_data = json.loads(request.body)
                        company_id = body_data.get('company_id')
                    except (json.JSONDecodeError, AttributeError):
                        # If not JSON, try form data
                        company_id = request.POST.get('company_id') or request.data.get('company_id') if hasattr(request, 'data') else None
            except Exception:
                pass
        
        # Method 3: Get from query parameters
        if not company_id:
            company_id = request.GET.get('company_id')
        
        # Method 4: Fallback to subdomain (backward compatibility)
        if not company_id:
            subdomain = None
            host = request.get_host().lower()
            if ':' in host:
                host = host.split(':')[0]
            parts = host.split('.')
            
            if 'localhost' in host or '127.0.0.1' in host:
                if len(parts) > 1 and parts[0] not in ['localhost', '127']:
                    subdomain = parts[0]
                else:
                    subdomain = 'default'
            else:
                if len(parts) >= 3:
                    subdomain = parts[0]
                elif len(parts) == 2:
                    subdomain = 'default'
            
            # Try to get tenant by subdomain
            if subdomain:
                try:
                    tenant = Tenant.objects.get(subdomain=subdomain, is_active=True)
                    company_id = tenant.company_id  # Store company_id for reference
                except Tenant.DoesNotExist:
                    if subdomain == 'default':
                        # Auto-create default tenant if it doesn't exist
                        tenant, created = Tenant.objects.get_or_create(
                            subdomain='default',
                            defaults={
                                'name': 'Default Tenant',
                                'is_active': True,
                                'is_trial': True,
                            }
                        )
                        if created:
                            import logging
                            logger = logging.getLogger(__name__)
                            logger.info(f"Auto-created default tenant: {tenant.id}")
                        company_id = tenant.company_id
        
        # Look up tenant by company_id
        if company_id:
            try:
                tenant = Tenant.objects.get(company_id=company_id.upper().strip(), is_active=True)
            except Tenant.DoesNotExist:
                # Don't raise error here - let views handle it
                tenant = None
            except Tenant.MultipleObjectsReturned:
                # Should not happen, but handle it
                tenant = Tenant.objects.filter(company_id=company_id.upper().strip(), is_active=True).first()
        
        # Fallback: If no tenant found and user is authenticated, use user's tenant_id
        if not tenant and hasattr(request, 'user') and request.user.is_authenticated:
            user = request.user
            if hasattr(user, 'tenant_id') and user.tenant_id:
                try:
                    tenant = Tenant.objects.get(id=user.tenant_id, is_active=True)
                    # Set company_id from tenant for reference
                    if tenant and not company_id:
                        company_id = tenant.company_id
                except Tenant.DoesNotExist:
                    tenant = None
        
        # Attach tenant to request
        request.tenant = tenant
        request.tenant_id = tenant.id if tenant else None
        request.company_id = company_id
        
        return None
