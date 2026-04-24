from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from .models import User


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    fieldsets = DjangoUserAdmin.fieldsets + (
        (
            "Hiigsi Tracker",
            {
                "fields": (
                    "is_mfa_enabled",
                    "daily_goal_hours",
                    "profile_image",
                )
            },
        ),
    )
    list_display = (
        "username",
        "email",
        "is_mfa_enabled",
        "is_staff",
        "is_active",
    )
    list_filter = ("is_staff", "is_superuser", "is_active", "is_mfa_enabled")
