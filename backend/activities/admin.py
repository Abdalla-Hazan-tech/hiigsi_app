from django.contrib import admin
from .models import Category, Activity, ActivityCompletion

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ["name", "user", "color_hex"]
    search_fields = ["name", "user__username"]

@admin.register(Activity)
class ActivityAdmin(admin.ModelAdmin):
    list_display = ["title", "category", "user", "created_at"]
    list_filter = ["category", "created_at"]
    search_fields = ["title", "description", "user__username"]

@admin.register(ActivityCompletion)
class ActivityCompletionAdmin(admin.ModelAdmin):
    list_display = ["activity", "date", "completed_at"]
    list_filter = ["date"]
    search_fields = ["activity__title", "activity__user__username"]
