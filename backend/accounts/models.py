from __future__ import annotations

from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    is_mfa_enabled = models.BooleanField(default=False)
    consistency_goal = models.IntegerField(default=80)
    profile_image = models.ImageField(upload_to="avatars/", null=True, blank=True)

    @property
    def avatar_url(self) -> str | None:
        try:
            return self.profile_image.url if self.profile_image else None
        except Exception:
            return None

    @property
    def display_name(self) -> str:
        full = self.get_full_name().strip()
        return full or self.username
