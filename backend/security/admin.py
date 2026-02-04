from django.contrib import admin

from .models import SecurityLog, RecoveryCode


@admin.register(SecurityLog)
class SecurityLogAdmin(admin.ModelAdmin):
    list_display = ("timestamp", "user", "action", "ip_address")
    list_filter = ("action", "timestamp")
    search_fields = ("user__username", "ip_address", "user_agent")


@admin.register(RecoveryCode)
class RecoveryCodeAdmin(admin.ModelAdmin):
    list_display = ("user", "used_at", "created_at")
    list_filter = ("used_at",)
    search_fields = ("user__username",)
