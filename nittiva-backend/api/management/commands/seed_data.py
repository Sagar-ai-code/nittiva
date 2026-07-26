"""
Management command to seed initial data.

This command creates initial admin user, clients, projects, and tasks for development.
"""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

from api.models import Client, Project, Task, Tenant

User = get_user_model()


class Command(BaseCommand):
    """Management command to seed initial data."""

    help = "Seed initial data"

    def handle(self, *args, **options):
        """Execute the seed data command."""
        # Ensure a default tenant exists for admin/demo access
        default_tenant, tenant_created = Tenant.objects.get_or_create(
            subdomain="default",
            defaults={
                "name": "Default Tenant",
                "is_active": True,
                "is_trial": True,
            },
        )
        if tenant_created:
            self.stdout.write(
                self.style.SUCCESS(f"Created default tenant: {default_tenant.company_id}")
            )
        else:
            self.stdout.write("Default tenant exists")

        # Create admin user
        admin_email = "admin@nittiva.local"
        admin_user, admin_created = User.objects.get_or_create(
            email=admin_email,
            defaults={
                "name": "Admin",
                "is_staff": True,
                "is_superuser": True,
                "tenant_id": default_tenant.id,
            },
        )
        if admin_created:
            admin_user.set_password("Admin@123")
            admin_user.save()
            self.stdout.write(
                self.style.SUCCESS(f"Created admin {admin_email} / Admin@123")
            )
        else:
            # Ensure existing admin is linked to the default tenant
            if hasattr(admin_user, "tenant_id") and not admin_user.tenant_id:
                admin_user.tenant_id = default_tenant.id
                admin_user.save(update_fields=["tenant_id"])
            self.stdout.write("Admin exists")

        # Create sample client
        c, _ = Client.objects.get_or_create(
            name="Acme Corp",
            defaults={
                "email": "contact@acme.test",
                "phone": "1234567890",
                "company": "Acme",
                "tenant_id": default_tenant.id,
            }
        )

        # Create sample project
        p, _ = Project.objects.get_or_create(
            name="Onboarding",
            defaults={
                "description": "Initial project",
                "status": "in_progress",
                "owner": admin_user,
                "tenant_id": default_tenant.id,
            }
        )
        # Ensure creator is a project member
        from api.models import ProjectMember
        ProjectMember.objects.get_or_create(
            project=p,
            user=admin_user,
            defaults={"role": "admin", "tenant_id": default_tenant.id},
        )

        # Create sample tasks
        Task.objects.get_or_create(
            title="Wire up API",
            defaults={
                "description": "Connect frontend",
                "status": "in_progress",
                "project_id": p.id,
                "tenant_id": default_tenant.id,
                "created_by": admin_user,
            }
        )
        Task.objects.get_or_create(
            title="Migrate DB",
            defaults={
                "description": "Migrations",
                "status": "todo",
                "project_id": p.id,
                "tenant_id": default_tenant.id,
                "created_by": admin_user,
            }
        )

        self.stdout.write(self.style.SUCCESS("Seed done"))
