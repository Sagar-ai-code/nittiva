# Hand-written migration for Chat (rooms, memberships, messages) and Invoice (invoices, line items).

import django.db.models.deletion
import uuid
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0014_leave_request_notification'),
    ]

    operations = [
        # ------------------------------------------------------------------
        # Chat
        # ------------------------------------------------------------------
        migrations.CreateModel(
            name='ChatRoom',
            fields=[
                ('tenant_id', models.UUIDField(blank=True, db_index=True, null=True)),
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('name', models.CharField(blank=True, default='', max_length=200)),
                ('is_group', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('created_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='created_chat_rooms', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'chat_rooms',
                'ordering': ['-updated_at'],
            },
        ),
        migrations.AddIndex(
            model_name='chatroom',
            index=models.Index(fields=['tenant_id', '-updated_at'], name='chat_room_tenant__recent_idx'),
        ),

        migrations.CreateModel(
            name='ChatRoomMembership',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('joined_at', models.DateTimeField(auto_now_add=True)),
                ('last_read_at', models.DateTimeField(blank=True, null=True)),
                ('room', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='memberships', to='api.chatroom')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='chat_memberships', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'chat_room_memberships',
            },
        ),
        migrations.AddConstraint(
            model_name='chatroommembership',
            constraint=models.UniqueConstraint(fields=('room', 'user'), name='uniq_chat_room_user'),
        ),
        migrations.AddIndex(
            model_name='chatroommembership',
            index=models.Index(fields=['user', '-joined_at'], name='chat_member_user_recent_idx'),
        ),

        migrations.CreateModel(
            name='ChatMessage',
            fields=[
                ('tenant_id', models.UUIDField(blank=True, db_index=True, null=True)),
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('content', models.TextField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('room', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='messages', to='api.chatroom')),
                ('sender', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='chat_messages', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'chat_messages',
                'ordering': ['created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='chatmessage',
            index=models.Index(fields=['tenant_id', 'room', '-created_at'], name='chat_msg_tenant__room_idx'),
        ),

        # Add the M2M through relationship on ChatRoom.participants
        migrations.AddField(
            model_name='chatroom',
            name='participants',
            field=models.ManyToManyField(related_name='chat_rooms', through='api.ChatRoomMembership', to=settings.AUTH_USER_MODEL),
        ),

        # ------------------------------------------------------------------
        # Invoice
        # ------------------------------------------------------------------
        migrations.CreateModel(
            name='Invoice',
            fields=[
                ('tenant_id', models.UUIDField(blank=True, db_index=True, null=True)),
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('invoice_number', models.CharField(max_length=50, unique=True)),
                ('issue_date', models.DateField()),
                ('due_date', models.DateField()),
                ('currency', models.CharField(default='USD', max_length=3)),
                ('tax_rate', models.DecimalField(decimal_places=2, default='0.00', max_digits=5)),
                ('discount', models.DecimalField(decimal_places=2, default='0.00', max_digits=12)),
                ('subtotal', models.DecimalField(decimal_places=2, default='0.00', max_digits=12)),
                ('tax_amount', models.DecimalField(decimal_places=2, default='0.00', max_digits=12)),
                ('total', models.DecimalField(decimal_places=2, default='0.00', max_digits=12)),
                ('status', models.CharField(choices=[
                    ('draft', 'Draft'), ('sent', 'Sent'), ('paid', 'Paid'),
                    ('overdue', 'Overdue'), ('cancelled', 'Cancelled'),
                ], default='draft', max_length=20)),
                ('notes', models.TextField(blank=True, default='')),
                ('paid_at', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('client', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='invoices', to='api.client')),
                ('issued_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='issued_invoices', to=settings.AUTH_USER_MODEL)),
                ('project', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='invoices', to='api.project')),
            ],
            options={
                'db_table': 'invoices',
                'ordering': ['-issue_date', '-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='invoice',
            index=models.Index(fields=['tenant_id', 'status'], name='invoice_tenant__status_idx'),
        ),
        migrations.AddIndex(
            model_name='invoice',
            index=models.Index(fields=['tenant_id', '-issue_date'], name='invoice_tenant__date_idx'),
        ),

        migrations.CreateModel(
            name='InvoiceLineItem',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('description', models.CharField(max_length=500)),
                ('quantity', models.DecimalField(decimal_places=2, default='1.00', max_digits=10)),
                ('unit_price', models.DecimalField(decimal_places=2, default='0.00', max_digits=12)),
                ('line_total', models.DecimalField(decimal_places=2, default='0.00', max_digits=12)),
                ('position', models.IntegerField(default=0)),
                ('invoice', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='line_items', to='api.invoice')),
            ],
            options={
                'db_table': 'invoice_line_items',
                'ordering': ['position', 'id'],
            },
        ),
    ]
