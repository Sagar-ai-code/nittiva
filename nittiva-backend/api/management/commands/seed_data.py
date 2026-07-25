"""
Management command to seed initial data.

This command creates initial admin user, clients, projects, and tasks for development.
"""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

from api.models import Client, Project, Task

User = get_user_model()


class Command(BaseCommand):
    """Management command to seed initial data."""

    help = "Seed initial data"

    def handle(self, *args, **options):
        """Execute the seed data command."""
        # Create admin user
        admin_email = "admin@nittiva.local"
        if not User.objects.filter(email=admin_email).exists():
            User.objects.create_superuser(
                email=admin_email,
                password="Admin@123",
                name="Admin"
            )
            self.stdout.write(
                self.style.SUCCESS(f"Created admin {admin_email} / Admin@123")
            )
        else:
            self.stdout.write("Admin exists")

        # Create sample client
        c, _ = Client.objects.get_or_create(
            name="Acme Corp",
            defaults={
                "email": "contact@acme.test",
                "phone": "1234567890",
                "company": "Acme"
            }
        )

        # Create sample project
        p, _ = Project.objects.get_or_create(
            name="Onboarding",
            defaults={
                "description": "Initial project",
                "status": "in_progress"
            }
        )

        # Create sample tasks
        Task.objects.get_or_create(
            title="Wire up API",
            defaults={
                "description": "Connect frontend",
                "status": "in_progress",
                "project_id": p.id
            }
        )
        Task.objects.get_or_create(
            title="Migrate DB",
            defaults={
                "description": "Migrations",
                "status": "todo",
                "project_id": p.id
            }
        )

        self.stdout.write(self.style.SUCCESS("Seed done"))
