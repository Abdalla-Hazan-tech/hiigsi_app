from __future__ import annotations

from django.conf import settings
from django.db import models


class SecurityLog(models.Model):
    class Action(models.TextChoices):
        LOGIN = "login", "Login"
        FAILED_LOGIN = "failed_login", "Failed Login"
        LOGIN_MFA_REQUIRED = "login_mfa_required", "Login MFA Required"
        MFA_FAILED = "mfa_failed", "MFA Failed"
        MFA_ENABLED = "mfa_enabled", "MFA Enabled"
        MFA_DISABLED = "mfa_disabled", "MFA Disabled"
        LOGOUT = "logout", "Logout"
        WEBAUTHN_REGISTERED = "webauthn_registered", "WebAuthn Registered"
        WEBAUTHN_FAILED = "webauthn_failed", "WebAuthn Failed"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="security_logs"
    )
    action = models.CharField(max_length=64, choices=Action.choices)
    ip_address = models.CharField(max_length=64, blank=True)
    user_agent = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-timestamp"]

    def __str__(self) -> str:  # pragma: no cover
        return f"{self.timestamp} {self.user_id} {self.action}"


class RecoveryCode(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="recovery_codes")
    code_hash = models.CharField(max_length=256)
    used_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [models.Index(fields=["user", "used_at"])]

    def __str__(self) -> str:  # pragma: no cover
        return f"RecoveryCode({self.user_id}, used_at={self.used_at})"


class WebAuthnCredential(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="webauthn_credentials")
    credential_id = models.CharField(max_length=255, unique=True)
    public_key = models.TextField()
    sign_count = models.IntegerField(default=0)
    credential_type = models.CharField(max_length=255, default="public-key")
    transports = models.CharField(max_length=255, blank=True, null=True)  # Comma-separated list
    created_at = models.DateTimeField(auto_now_add=True)
    last_used_at = models.DateTimeField(null=True, blank=True)
    name = models.CharField(max_length=255, blank=True)

    def __str__(self):
        return f"WebAuthnCredential({self.user}, {self.name or self.credential_id})"
