"""
Goals and Alignment models.

This module contains Goal and GoalLinkedEntity models for outcome alignment.
"""
import uuid
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator


class Goal(models.Model):
    """Goal model for outcome alignment."""
    
    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        ACTIVE = "active", "Active"
        ACHIEVED = "achieved", "Achieved"
        ARCHIVED = "archived", "Archived"
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Multi-tenant
    tenant_id = models.UUIDField(null=True, blank=True, db_index=True, help_text="Tenant this goal belongs to")
    
    # Goal details
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    
    # Alignment
    parent_goal = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="child_goals"
    )
    
    # Ownership
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="owned_goals"
    )
    
    # Metrics
    target_value = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    current_value = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    progress_percentage = models.PositiveSmallIntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    
    # Weighted impact
    weight = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=1.0,
        validators=[MinValueValidator(0), MaxValueValidator(10)]
    )
    
    # Dates
    start_date = models.DateField(null=True, blank=True)
    target_date = models.DateField(null=True, blank=True)
    achieved_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = "goals"
        indexes = [
            models.Index(fields=["tenant_id", "status"]),
            models.Index(fields=["tenant_id", "owner"]),
            models.Index(fields=["tenant_id", "parent_goal"]),
        ]
        ordering = ["-created_at"]
    
    def __str__(self):
        return self.title
    
    def calculate_progress(self):
        """Calculate progress from linked entities."""
        from .project import Project
        from .task import Task
        
        linked_projects = self.linked_entities.filter(
            entity_type="project"
        ).values_list("entity_id", flat=True)
        
        linked_tasks = self.linked_entities.filter(
            entity_type="task"
        ).values_list("entity_id", flat=True)
        
        # Calculate from projects
        if linked_projects:
            projects = Project.objects.filter(id__in=linked_projects, tenant_id=self.tenant_id)
            if projects.exists():
                # Simple progress calculation - average of project statuses
                total_progress = 0
                for p in projects:
                    if p.status == "completed":
                        total_progress += 100
                    elif p.status == "in-progress":
                        total_progress += 50
                    elif p.status == "todo":
                        total_progress += 0
                
                self.current_value = total_progress / projects.count()
        
        # Calculate from tasks
        if linked_tasks:
            tasks = Task.objects.filter(id__in=linked_tasks, tenant_id=self.tenant_id)
            if tasks.exists():
                total_progress = sum(t.progress for t in tasks) / tasks.count()
                if linked_projects:
                    # Average if both exist
                    self.current_value = (self.current_value + (total_progress / 100.0)) / 2
                else:
                    self.current_value = total_progress / 100.0
        
        # Update percentage
        if self.target_value and self.target_value > 0:
            self.progress_percentage = min(100, int((float(self.current_value) / float(self.target_value)) * 100))
        else:
            self.progress_percentage = int(float(self.current_value) * 100)
        
        self.save(update_fields=["current_value", "progress_percentage"])
        return self.progress_percentage


class GoalLinkedEntity(models.Model):
    """Links goals to projects, tasks, or other entities."""
    
    class EntityType(models.TextChoices):
        PROJECT = "project", "Project"
        TASK = "task", "Task"
        INITIATIVE = "initiative", "Initiative"
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Multi-tenant
    tenant_id = models.UUIDField(null=True, blank=True, db_index=True, help_text="Tenant this link belongs to")
    
    goal = models.ForeignKey(
        Goal,
        on_delete=models.CASCADE,
        related_name="linked_entities"
    )
    
    entity_type = models.CharField(max_length=20, choices=EntityType.choices)
    entity_id = models.UUIDField()  # Generic ID for project/task/initiative
    
    # Weight for this link
    weight = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=1.0,
        validators=[MinValueValidator(0), MaxValueValidator(10)]
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = "goal_linked_entities"
        indexes = [
            models.Index(fields=["tenant_id", "goal"]),
            models.Index(fields=["tenant_id", "entity_type", "entity_id"]),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["goal", "entity_type", "entity_id"],
                name="unique_goal_entity"
            )
        ]
    
    def __str__(self):
        return f"{self.goal.title} → {self.entity_type}:{self.entity_id}"
