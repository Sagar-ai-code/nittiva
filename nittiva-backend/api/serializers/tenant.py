"""
Tenant serializers.

This module contains serializers for tenant management.
"""

from rest_framework import serializers
from ..models import Tenant
import re


class TenantSerializer(serializers.ModelSerializer):
    """Serializer for tenant data."""
    
    domain = serializers.CharField(read_only=True)  # Removed redundant source='domain'
    user_count = serializers.SerializerMethodField()
    project_count = serializers.SerializerMethodField()
    
    # Optional fields for creating initial admin user
    admin_email = serializers.EmailField(write_only=True, required=False, help_text="Email for initial admin user")
    admin_password = serializers.CharField(write_only=True, required=False, min_length=6, help_text="Password for initial admin user")
    admin_first_name = serializers.CharField(write_only=True, required=False, help_text="First name for initial admin user")
    admin_last_name = serializers.CharField(write_only=True, required=False, help_text="Last name for initial admin user")
    
    class Meta:
        model = Tenant
        fields = [
            'id',
            'company_id',
            'subdomain',
            'name',
            'email',
            'is_active',
            'is_trial',
            'domain',
            'user_count',
            'project_count',
            'created_at',
            'updated_at',
            # Initial admin user fields
            'admin_email',
            'admin_password',
            'admin_first_name',
            'admin_last_name',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'domain']
    
    def get_user_count(self, obj):
        """Get number of users in this tenant."""
        from django.contrib.auth import get_user_model
        User = get_user_model()
        return User.objects.filter(tenant_id=obj.id).count()
    
    def get_project_count(self, obj):
        """Get number of projects in this tenant."""
        from ..models import Project
        return Project.objects.filter(tenant_id=obj.id).count()
    
    def validate_company_id(self, value):
        """Validate company_id format."""
        if not value:
            raise serializers.ValidationError("Company ID is required")
        
        # Normalize to uppercase
        value = value.upper().strip()
        
        # Validate format: alphanumeric, 3-20 characters
        if not re.match(r'^[A-Z0-9]{3,20}$', value):
            raise serializers.ValidationError(
                "Company ID must be 3-20 characters, uppercase alphanumeric only."
            )
        
        # Check if company_id already exists
        if self.instance:  # Update
            if Tenant.objects.filter(company_id=value).exclude(id=self.instance.id).exists():
                raise serializers.ValidationError("A tenant with this company ID already exists")
        else:  # Create
            if Tenant.objects.filter(company_id=value).exists():
                raise serializers.ValidationError("A tenant with this company ID already exists")
        
        return value
    
    def validate_subdomain(self, value):
        """Validate subdomain format and reserved names (optional field)."""
        if not value:
            return value  # Subdomain is optional now
        
        # Convert to lowercase
        value = value.lower().strip()
        
        # Reserved subdomains
        RESERVED_SUBDOMAINS = [
            'www', 'api', 'admin', 'mail', 'ftp', 'localhost', 
            'test', 'staging', 'dev', 'development', 'app',
            'support', 'help', 'docs', 'blog', 'status'
        ]
        
        if value in RESERVED_SUBDOMAINS:
            raise serializers.ValidationError(
                f"'{value}' is a reserved subdomain. Please choose another."
            )
        
        # Validate format: lowercase alphanumeric with hyphens, 1-63 chars
        if not re.match(r'^[a-z0-9]([a-z0-9\-]{0,61}[a-z0-9])?$', value):
            raise serializers.ValidationError(
                "Subdomain must be 1-63 characters, lowercase alphanumeric with hyphens only. "
                "Must start and end with alphanumeric character."
            )
        
        # Check if subdomain already exists
        if self.instance:  # Update
            if Tenant.objects.filter(subdomain=value).exclude(id=self.instance.id).exists():
                raise serializers.ValidationError("A tenant with this subdomain already exists")
        else:  # Create
            if Tenant.objects.filter(subdomain=value).exists():
                raise serializers.ValidationError("A tenant with this subdomain already exists")
        
        return value
    
    def validate_name(self, value):
        """Validate tenant name."""
        if not value or not value.strip():
            raise serializers.ValidationError("Tenant name is required")
        return value.strip()
    
    def validate(self, attrs):
        """Validate initial admin user fields if provided."""
        admin_email = attrs.get('admin_email')
        admin_password = attrs.get('admin_password')
        
        # If any admin field is provided, all required fields must be provided
        if admin_email or admin_password:
            if not admin_email:
                raise serializers.ValidationError({
                    'admin_email': 'Admin email is required when creating initial admin user.'
                })
            if not admin_password:
                raise serializers.ValidationError({
                    'admin_password': 'Admin password is required when creating initial admin user.'
                })
        
        return attrs
    
    def create(self, validated_data):
        """Create tenant and optionally create initial admin user."""
        # Extract admin user fields
        admin_email = validated_data.pop('admin_email', None)
        admin_password = validated_data.pop('admin_password', None)
        admin_first_name = validated_data.pop('admin_first_name', '')
        admin_last_name = validated_data.pop('admin_last_name', '')
        
        # Create tenant
        tenant = super().create(validated_data)
        
        # Create initial admin user if provided
        if admin_email and admin_password:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            
            # Check if user with this email already exists
            if User.objects.filter(email=admin_email).exists():
                # Don't raise error, just log it - tenant is already created
                import logging
                logger = logging.getLogger(__name__)
                logger.warning(f"User with email {admin_email} already exists. Skipping initial admin user creation.")
            else:
                # Create admin user
                admin_name = f"{admin_first_name} {admin_last_name}".strip() or admin_email.split('@')[0]
                admin_user = User.objects.create_user(
                    email=admin_email,
                    password=admin_password,
                    name=admin_name,
                    tenant_id=tenant.id,
                    role='admin',  # Set as admin role
                    is_active=True,
                )
                
                import logging
                logger = logging.getLogger(__name__)
                logger.info(f"Created initial admin user {admin_email} for tenant {tenant.name} (ID: {tenant.company_id})")
        
        return tenant
