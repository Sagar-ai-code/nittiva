# Multi-Tenant Foundation Implementation

## Overview

This document describes the multi-tenant foundation implementation for Nittiva. The system now supports multiple tenants (organizations/workspaces) with complete data isolation.

## What Has Been Implemented

### 1. Tenant Model (`api/models/tenant.py`)
- **Tenant** model with UUID primary key
- Subdomain-based identification (e.g., `acme.nittiva.com`)
- Tenant status management (active/inactive, trial)
- Full domain property for easy access

### 2. Tenant ID Fields
All models now include `tenant_id` field:
- ✅ `User` - Each user belongs to a tenant
- ✅ `Project` - Each project belongs to a tenant
- ✅ `Task` - Each task belongs to a tenant
- ✅ `Client` - Each client belongs to a tenant
- ✅ `ProjectMember` - Each membership belongs to a tenant
- ✅ `TaskAssignment` - Each assignment belongs to a tenant

### 3. Tenant Middleware (`api/middleware/tenant.py`)
- Resolves tenant from subdomain in request host
- Supports localhost development (e.g., `acme.localhost:8000`)
- Supports `X-Tenant-Subdomain` header for API testing
- Attaches `request.tenant` and `request.tenant_id` to all requests

### 4. Tenant-Scoped Queries
All ViewSets now filter by tenant:
- ✅ `ProjectViewSet` - Only shows projects for current tenant
- ✅ `TaskViewSet` - Only shows tasks for current tenant
- ✅ `UserViewSet` - Only shows users for current tenant
- ✅ `ClientViewSet` - Only shows clients for current tenant
- ✅ `DashboardView` - Statistics scoped to current tenant

### 5. Serializer Updates
All serializers automatically assign `tenant_id` on create:
- ✅ `RegisterSerializer` - Assigns tenant to new users
- ✅ `ProjectSerializer` - Assigns tenant to new projects
- ✅ `TaskSerializer` - Assigns tenant to new tasks
- ✅ `ClientSerializer` - Assigns tenant to new clients

### 6. Database Migrations
- Migration `0005_tenant_*` adds tenant support
- Creates Tenant table
- Adds `tenant_id` to all models
- Creates composite indexes for tenant-scoped queries
- Adds unique constraint: `(tenant_id, email)` for users

### 7. Utility Functions (`api/utils/tenant.py`)
- `get_current_tenant(request)` - Get tenant from request
- `get_current_tenant_id(request)` - Get tenant ID from request
- `filter_by_tenant(queryset, tenant_id)` - Filter queryset by tenant
- `ensure_tenant_id(model_instance, tenant_id)` - Set tenant on model

### 8. Management Command
- `create_default_tenant` - Creates a default tenant for development

## Database Schema

### Tenant Table
```sql
CREATE TABLE tenants (
    id UUID PRIMARY KEY,
    subdomain VARCHAR(63) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    email VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    is_trial BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### Example: User Table with Tenant
```sql
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL,
    email VARCHAR(255) NOT NULL,
    ...
    UNIQUE(tenant_id, email)  -- Email unique per tenant
);
```

## How It Works

### 1. Tenant Resolution Flow

```
Request → TenantMiddleware → Extract Subdomain → Lookup Tenant → Attach to Request
```

**Example:**
- Request to `acme.nittiva.com` → Subdomain: `acme` → Tenant lookup → `request.tenant` set
- Request to `localhost:8000` → Subdomain: `default` → Default tenant
- Request with `X-Tenant-Subdomain: acme` header → Tenant lookup → `request.tenant` set

### 2. Data Isolation

All queries are automatically scoped to the current tenant:

```python
# In ViewSet
def get_queryset(self):
    tenant_id = get_current_tenant_id(self.request)
    return Project.objects.filter(tenant_id=tenant_id)
```

### 3. Creating New Records

Serializers automatically assign tenant:

```python
# In Serializer
def create(self, validated_data):
    tenant_id = get_current_tenant_id(self.request)
    return Project.objects.create(tenant_id=tenant_id, **validated_data)
```

## Testing the Implementation

### 1. Create a Default Tenant

```bash
cd nittiva-backend
python manage.py create_default_tenant
python manage.py create_default_tenant --subdomain acme --name "Acme Corp"
```

### 2. Run Migrations

```bash
python manage.py migrate
```

### 3. Test with Different Subdomains

#### Option A: Using Host Header (Development)
```bash
# Default tenant
curl http://localhost:8000/api/projects/ \
  -H "Authorization: Bearer YOUR_TOKEN"

# Specific tenant (if using hosts file)
curl http://acme.localhost:8000/api/projects/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Option B: Using X-Tenant-Subdomain Header
```bash
curl http://localhost:8000/api/projects/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-Tenant-Subdomain: acme"
```

### 4. Test Data Isolation

1. Create tenant "acme":
   ```bash
   python manage.py create_default_tenant --subdomain acme --name "Acme Corp"
   ```

2. Create tenant "beta":
   ```bash
   python manage.py create_default_tenant --subdomain beta --name "Beta Inc"
   ```

3. Create a project for "acme" tenant:
   ```bash
   curl -X POST http://localhost:8000/api/projects/ \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "X-Tenant-Subdomain: acme" \
     -H "Content-Type: application/json" \
     -d '{"name": "Acme Project"}'
   ```

4. Verify "beta" tenant cannot see "acme" project:
   ```bash
   curl http://localhost:8000/api/projects/ \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "X-Tenant-Subdomain: beta"
   ```
   Should return empty list or only beta's projects.

### 5. Test User Registration

```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "X-Tenant-Subdomain: acme" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@acme.com",
    "password": "SecurePass123!",
    "password_confirmation": "SecurePass123!",
    "name": "John Doe"
  }'
```

The user will be automatically assigned to the "acme" tenant.

## Configuration

### Middleware Order
The `TenantMiddleware` is placed early in the middleware stack (after CORS) to ensure tenant is available for all subsequent middleware and views.

```python
MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "api.middleware.TenantMiddleware",  # ← Tenant resolution
    "django.middleware.security.SecurityMiddleware",
    # ... rest of middleware
]
```

### Development Setup

For local development, you can:

1. **Use default tenant:**
   - Access `http://localhost:8000` → Uses "default" tenant
   - Create default tenant: `python manage.py create_default_tenant`

2. **Use subdomain (requires hosts file):**
   - Add to `/etc/hosts` (Linux/Mac) or `C:\Windows\System32\drivers\etc\hosts` (Windows):
     ```
     127.0.0.1 acme.localhost
     127.0.0.1 beta.localhost
     ```
   - Access `http://acme.localhost:8000` → Uses "acme" tenant

3. **Use header (easiest for testing):**
   - Always include `X-Tenant-Subdomain: acme` header in requests

## Important Notes

### ⚠️ Existing Data
- Existing records will have `tenant_id = NULL` after migration
- You need to populate tenant_id for existing data manually or via data migration
- For new installations, this is not an issue

### ⚠️ User Email Uniqueness
- Email uniqueness is now **per tenant**, not globally
- Same email can exist in different tenants
- Constraint: `UNIQUE(tenant_id, email)`

### ⚠️ Authentication
- Users must belong to the tenant they're accessing
- Login should validate user's tenant matches request tenant
- Consider updating login logic to verify tenant match

## Next Steps

1. **Populate Existing Data:**
   - Create a data migration to assign existing records to a default tenant
   - Or manually update tenant_id for existing records

2. **Update Authentication:**
   - Verify user's tenant matches request tenant during login
   - Add tenant validation in login view

3. **Frontend Integration:**
   - Update frontend to send `X-Tenant-Subdomain` header
   - Or configure subdomain-based routing

4. **Production Setup:**
   - Configure DNS for subdomain routing
   - Set up reverse proxy (Nginx/ALB) to route by subdomain
   - Ensure SSL certificates for all tenant subdomains

## Files Modified/Created

### New Files:
- `api/models/tenant.py` - Tenant model
- `api/middleware/__init__.py` - Middleware package
- `api/middleware/tenant.py` - Tenant middleware
- `api/utils/tenant.py` - Tenant utilities
- `api/management/commands/create_default_tenant.py` - Management command
- `api/migrations/0005_tenant_*.py` - Database migration

### Modified Files:
- `api/models/user.py` - Added tenant_id
- `api/models/project.py` - Added tenant_id
- `api/models/task.py` - Added tenant_id
- `api/models/client.py` - Added tenant_id
- `api/views/project.py` - Tenant-scoped queries
- `api/views/task.py` - Tenant-scoped queries
- `api/views/user.py` - Tenant-scoped queries
- `api/views/client.py` - Tenant-scoped queries
- `api/views/dashboard.py` - Tenant-scoped statistics
- `api/serializers/user.py` - Tenant assignment
- `api/serializers/project.py` - Tenant assignment
- `api/serializers/task.py` - Tenant assignment
- `api/serializers/client.py` - Tenant assignment
- `nittiva_backend/settings/base.py` - Added middleware

## Summary

✅ **Multi-tenant foundation is complete!**

The system now supports:
- Multiple tenants with complete data isolation
- Subdomain-based tenant resolution
- Automatic tenant assignment on record creation
- Tenant-scoped queries across all models
- Development-friendly testing with headers

You can now test the implementation using the methods described above.
