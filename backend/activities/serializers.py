from __future__ import annotations

from rest_framework import serializers

from .models import Category, Activity, ActivityCompletion


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "color_hex"]

    def validate_name(self, value):
        user = self.context["request"].user
        exists = Category.objects.filter(user=user, name=value).exclude(pk=self.instance.pk if self.instance else None).exists()
        if exists:
            raise serializers.ValidationError("Category with this name already exists")
        return value


class ActivitySerializer(serializers.ModelSerializer):
    is_completed = serializers.BooleanField(read_only=True, default=False)
    occurrence_count = serializers.IntegerField(read_only=True, default=0)
    
    class Meta:
        model = Activity
        fields = [
            "id",
            "title",
            "description",
            "category",
            "daily_occurrences",
            "is_completed",
            "occurrence_count",
        ]
        read_only_fields = ["is_completed", "occurrence_count"]


class ActivityCompletionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ActivityCompletion
        fields = ["id", "activity", "date", "occurrence_count", "completed_at"]
