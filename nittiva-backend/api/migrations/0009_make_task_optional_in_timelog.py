# Generated manually to make task optional in TimeLog model

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0008_attachment_comment_goal_goallinkedentity_timelog_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='timelog',
            name='task',
            field=models.ForeignKey(
                blank=True,
                help_text='Optional task this time log is associated with',
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name='time_logs',
                to='api.task'
            ),
        ),
    ]
