"""
Management command to create a default tenant for development/testing.

Usage:
    python manage.py create_default_tenant
    python manage.py create_default_tenant --subdomain acme --name "Acme Corp"
"""

from django.core.management.base import BaseCommand
from api.models import Tenant


class Command(BaseCommand):
    help = "Create a default tenant for development/testing"

    def add_arguments(self, parser):
        parser.add_argument(
            "--subdomain",
            type=str,
            default="default",
            help="Subdomain for the tenant (default: 'default')",
        )
        parser.add_argument(
            "--name",
            type=str,
            default="Default Tenant",
            help="Name for the tenant (default: 'Default Tenant')",
        )

    def handle(self, *args, **options):
        subdomain = options["subdomain"]
        name = options["name"]

        tenant, created = Tenant.objects.get_or_create(
            subdomain=subdomain,
            defaults={
                "name": name,
                "is_active": True,
                "is_trial": True,
            },
        )

        if created:
            self.stdout.write(
                self.style.SUCCESS(
                    f'Successfully created tenant "{name}" with subdomain "{subdomain}"'
                )
            )
            self.stdout.write(f"Tenant ID: {tenant.id}")
            self.stdout.write(f"Domain: {tenant.domain}")
        else:
            self.stdout.write(
                self.style.WARNING(
                    f'Tenant with subdomain "{subdomain}" already exists'
                )
            )
            self.stdout.write(f"Tenant ID: {tenant.id}")
            self.stdout.write(f"Domain: {tenant.domain}")
