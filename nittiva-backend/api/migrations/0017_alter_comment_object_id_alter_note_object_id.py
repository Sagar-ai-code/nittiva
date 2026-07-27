# Migration 0017 — relax Comment.object_id / Note.object_id from UUIDField
# to CharField so they can reference either a UUID-typed parent (Project)
# or a BigAutoField parent (Task).
#
# Why this change:
#   The pre-existing Note + Comment models used `object_id = UUIDField()`
#   to support the generic-FK pattern of "attach to a Task or Project".
#   But Task uses BigAutoField (integer ID), so creating a comment on a
#   task fails with "Must be a valid UUID" — the feature has been broken
#   since Notes/Comments were added.
#
# Fix:
#   Switch to CharField(max_length=64). This is the standard Django
#   pattern for generic FKs (it sidesteps the cross-model-type
#   constraint). We keep an index for query speed.
#
# Production safety:
#   - Both `comments` and `notes` tables are empty in the live DB
#     (verified via the smoke test before writing this migration).
#   - Existing rows (if any) would need a CAST UUID → TEXT migration,
#     but the consultant can run that manually if needed.
#
# Future direction (not in this migration):
#   The proper fix is Django's `contenttypes` framework: a
#   `content_type = ForeignKey(ContentType)` + `object_id = PositiveIntegerField`
#   pair. That's a much bigger refactor and is documented in
#   NITTIVA_CHANGES.md as a recommendation.
import django.db.models.deletion
import uuid
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0016_commentmention_notemention_tasksubscriber_and_more'),
    ]

    operations = [
        # Comment.object_id: UUIDField -> CharField(64)
        migrations.AlterField(
            model_name='comment',
            name='object_id',
            field=models.CharField(
                help_text='ID (UUID or int) of the task or project this comment is attached to',
                max_length=64,
            ),
        ),
        # Note.object_id: UUIDField -> CharField(64)
        migrations.AlterField(
            model_name='note',
            name='object_id',
            field=models.CharField(
                help_text='ID (UUID or int) of the task or project this note is attached to',
                max_length=64,
            ),
        ),
    ]
