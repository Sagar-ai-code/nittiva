# Migration 0018 — per-tenant invoice numbering (consultant feedback #2)
#
# Today Invoice.invoice_number has a global `unique=True` constraint, so
# two tenants can't both have "INV-0001". This drops the global unique
# constraint and adds a per-tenant one instead, plus drops the
# `unique=True` flag on the model field (the new UniqueConstraint below
# is the source of truth).
#
# Production safety:
# - The `invoices` table is empty in the live DB (verified via the
#   smoke test: "no invoices in DB to test"). If you have data,
#   backfill `invoice_number` per tenant before applying this:
#     UPDATE invoices SET invoice_number = 'INV-' || row_number
#       OVER (PARTITION BY tenant_id ORDER BY created_at) WHERE ...
# - The new constraint is enforced at the DB level. The Invoice.save()
#   override auto-generates the next number per tenant; concurrent
#   inserts will race but the constraint will reject the loser.
#
# Pair with: api/serializers/invoice.py (now marks invoice_number
# as read-only so the client can't bypass auto-generation).
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0017_alter_comment_object_id_alter_note_object_id'),
    ]

    operations = [
        migrations.AlterField(
            model_name='invoice',
            name='invoice_number',
            field=models.CharField(max_length=50),
        ),
        migrations.AddConstraint(
            model_name='invoice',
            constraint=models.UniqueConstraint(
                fields=('tenant_id', 'invoice_number'),
                name='uniq_invoice_per_tenant',
            ),
        ),
    ]
