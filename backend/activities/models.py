from __future__ import annotations

from django.conf import settings
from django.core.validators import RegexValidator
from django.db import models


hex_color_validator = RegexValidator(
    regex=r"^#[0-9A-Fa-f]{6}$",
    message="color_hex must be a hex color like #RRGGBB",
)


class Category(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="categories")
    name = models.CharField(max_length=100)
    color_hex = models.CharField(max_length=7, validators=[hex_color_validator])

    class Meta:
        unique_together = ("user", "name")
        ordering = ["name"]

    def __str__(self) -> str:  # pragma: no cover
        return f"{self.name}"


class Activity(models.Model):
    """
    Defines a task/activity that the user wants to track daily.
    """
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="activities")
    category = models.ForeignKey(Category, null=True, blank=True, on_delete=models.SET_NULL, related_name="activities")
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    daily_occurrences = models.PositiveIntegerField(default=1, help_text="Number of times this task occurs per day")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["title"]

    def __str__(self) -> str:
        return self.title


class ActivityCompletion(models.Model):
    """
    Records that an activity was completed on a specific date.
    """
    activity = models.ForeignKey(Activity, on_delete=models.CASCADE, related_name="completions")
    date = models.DateField()
    occurrence_count = models.PositiveIntegerField(default=1, help_text="How many occurrences completed")
    completed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("activity", "date")
        indexes = [
            models.Index(fields=["activity", "date"]),
        ]

    def __str__(self) -> str:
        return f"{self.activity.title} ({self.date}) - {self.occurrence_count}/{self.activity.daily_occurrences}"
