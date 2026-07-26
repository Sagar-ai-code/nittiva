# Hand-written migration for LeaveRequest and Notification models.

import django.db.models.deletion
import uuid
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0013_note_todo_meeting'),
    ]

    operations = [
        # ------------------------------------------------------------------
        # LeaveRequest
        # ------------------------------------------------------------------
        migrations.CreateModel(
            name='LeaveRequest',
            fields=[
                ('tenant_id', models.UUIDField(blank=True, db_index=True, null=True)),
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('leave_type', models.CharField(choices=[
                    ('annual', 'Annual Leave'),
                    ('sick', 'Sick Leave'),
                    ('personal', 'Personal'),
                    ('maternity', 'Maternity / Paternity'),
                    ('emergency', 'Emergency'),
                    ('unpaid', 'Unpaid Leave'),
                ], default='annual', max_length=20)),
                ('start_date', models.DateField()),
                ('end_date', models.DateField()),
                ('reason', models.TextField(blank=True, default='')),
                ('status', models.CharField(choices=[
                    ('pending', 'Pending'),
                    ('approved', 'Approved'),
                    ('rejected', 'Rejected'),
                    ('cancelled', 'Cancelled'),
                ], default='pending', max_length=20)),
                ('approver_comments', models.TextField(blank=True, default='')),
                ('decided_at', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('approver', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='approved_leave_requests', to=settings.AUTH_USER_MODEL)),
                ('requester', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='leave_requests', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'leave_requests',
                'ordering': ['-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='leaverequest',
            index=models.Index(fields=['tenant_id', 'status'], name='leave_req_tenant__status_idx'),
        ),
        migrations.AddIndex(
            model_name='leaverequest',
            index=models.Index(fields=['tenant_id', 'requester'], name='leave_req_tenant__req_idx'),
        ),
        migrations.AddIndex(
            model_name='leaverequest',
            index=models.Index(fields=['tenant_id', 'start_date'], name='leave_req_tenant__start_idx'),
        ),

        # ------------------------------------------------------------------
        # Notification
        # ------------------------------------------------------------------
        migrations.CreateModel(
            name='Notification',
            fields=[
                ('tenant_id', models.UUIDField(blank=True, db_index=True, null=True)),
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('type', models.CharField(choices=[
                    ('info', 'Info'),
                    ('success', 'Success'),
                    ('warning', 'Warning'),
                    ('error', 'Error'),
                ], default='info', max_length=20)),
                ('title', models.CharField(max_length=255)),
                ('message', models.TextField(blank=True, default='')),
                ('link', models.CharField(blank=True, default='', max_length=512)),
                ('is_read', models.BooleanField(default=False)),
                ('read_at', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('recipient', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='notifications', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'notifications',
                'ordering': ['-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='notification',
            index=models.Index(fields=['tenant_id', 'recipient', 'is_read'], name='notif_tenant__read_idx'),
        ),
        migrations.AddIndex(
            model_name='notification',
            index=models.Index(fields=['tenant_id', 'recipient', '-created_at'], name='notif_tenant__recent_idx'),
        ),
    ]
