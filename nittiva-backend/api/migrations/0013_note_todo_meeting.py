# Hand-written migration for Note, Todo, Meeting models.
# These three models are added together since the frontend expects all
# three to be available — the Notes / Todos / Meetings pages wire to
# /api/notes/, /api/todos/, /api/meetings/ respectively.

import django.db.models.deletion
import uuid
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0012_taskpriority_task_custom_priority_taskstatus_and_more'),
    ]

    operations = [
        # ------------------------------------------------------------------
        # Note
        # ------------------------------------------------------------------
        migrations.CreateModel(
            name='Note',
            fields=[
                ('tenant_id', models.UUIDField(blank=True, db_index=True, help_text='Tenant this note belongs to', null=True)),
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('content_type', models.CharField(help_text='"task" or "project"', max_length=20)),
                ('object_id', models.UUIDField(help_text='UUID of the task or project this note is attached to')),
                ('title', models.CharField(blank=True, default='', max_length=255)),
                ('content', models.TextField()),
                ('is_pinned', models.BooleanField(default=False)),
                ('color', models.CharField(blank=True, default='', max_length=20)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('author', models.ForeignKey(help_text='User who wrote the note', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='notes', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'notes',
                'ordering': ['-is_pinned', '-updated_at'],
            },
        ),
        migrations.AddIndex(
            model_name='note',
            index=models.Index(fields=['tenant_id', 'content_type', 'object_id'], name='notes_tenant__content_idx'),
        ),
        migrations.AddIndex(
            model_name='note',
            index=models.Index(fields=['tenant_id', 'author'], name='notes_tenant__author_idx'),
        ),

        # ------------------------------------------------------------------
        # Todo
        # ------------------------------------------------------------------
        migrations.CreateModel(
            name='Todo',
            fields=[
                ('tenant_id', models.UUIDField(blank=True, db_index=True, help_text='Tenant this todo belongs to', null=True)),
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('title', models.CharField(max_length=255)),
                ('description', models.TextField(blank=True, default='')),
                ('completed', models.BooleanField(default=False)),
                ('completed_at', models.DateTimeField(blank=True, null=True)),
                ('project_id', models.UUIDField(blank=True, db_index=True, null=True)),
                ('due_date', models.DateTimeField(blank=True, null=True)),
                ('priority', models.CharField(choices=[('low', 'Low'), ('medium', 'Medium'), ('high', 'High')], default='medium', max_length=10)),
                ('position', models.IntegerField(default=0)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('owner', models.ForeignKey(help_text='User who owns this todo', on_delete=django.db.models.deletion.CASCADE, related_name='owned_todos', to=settings.AUTH_USER_MODEL)),
                ('assigned_to', models.ForeignKey(blank=True, help_text='User this todo is assigned to', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='assigned_todos', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'todos',
                'ordering': ['completed', 'position', '-updated_at'],
            },
        ),
        migrations.AddIndex(
            model_name='todo',
            index=models.Index(fields=['tenant_id', 'owner'], name='todos_tenant__owner_idx'),
        ),
        migrations.AddIndex(
            model_name='todo',
            index=models.Index(fields=['tenant_id', 'completed'], name='todos_tenant__completed_idx'),
        ),

        # ------------------------------------------------------------------
        # Meeting
        # ------------------------------------------------------------------
        migrations.CreateModel(
            name='Meeting',
            fields=[
                ('tenant_id', models.UUIDField(blank=True, db_index=True, help_text='Tenant this meeting belongs to', null=True)),
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('title', models.CharField(max_length=255)),
                ('description', models.TextField(blank=True, default='')),
                ('location', models.CharField(blank=True, default='', max_length=255)),
                ('meeting_url', models.URLField(blank=True, default='')),
                ('start_time', models.DateTimeField()),
                ('end_time', models.DateTimeField()),
                ('project_id', models.UUIDField(blank=True, db_index=True, null=True)),
                ('status', models.CharField(choices=[('scheduled', 'Scheduled'), ('in_progress', 'In Progress'), ('completed', 'Completed'), ('cancelled', 'Cancelled')], default='scheduled', max_length=20)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('organizer', models.ForeignKey(help_text='User who organized the meeting', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='organized_meetings', to=settings.AUTH_USER_MODEL)),
                ('participants', models.ManyToManyField(blank=True, help_text='Users invited to the meeting', related_name='meetings', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'meetings',
                'ordering': ['start_time'],
            },
        ),
        migrations.AddIndex(
            model_name='meeting',
            index=models.Index(fields=['tenant_id', 'start_time'], name='meetings_tenant__start_idx'),
        ),
        migrations.AddIndex(
            model_name='meeting',
            index=models.Index(fields=['tenant_id', 'status'], name='meetings_tenant__status_idx'),
        ),
    ]
