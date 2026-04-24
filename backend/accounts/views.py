from __future__ import annotations

import base64
import os
import secrets
from datetime import datetime, timedelta
from typing import List

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import check_password, make_password
from django.contrib.auth.models import update_last_login
from django.core.cache import cache
from django.db import transaction
from django.utils import timezone
from django_otp.plugins.otp_totp.models import TOTPDevice
from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import ValidationError as DRFValidationError
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView

from security.models import SecurityLog, RecoveryCode
from .serializers import (
    LoginSerializer,
    MFAVerifySerializer,
    UserSerializer,
    MFAEnableSerializer,
    MFADisableSerializer,
    LogoutSerializer,
    RegisterSerializer,
)

User = get_user_model()


def _issue_tokens(user: User) -> dict:
    refresh = RefreshToken.for_user(user)
    update_last_login(None, user)
    return {"access": str(refresh.access_token), "refresh": str(refresh)}


def _log(user: User | None, action: str, request) -> None:
    try:
        SecurityLog.objects.create(
            user=user,
            action=action,
            ip_address=request.META.get("REMOTE_ADDR") or request.META.get("HTTP_X_FORWARDED_FOR", ""),
            user_agent=request.META.get("HTTP_USER_AGENT", ""),
        )
    except Exception:
        # Avoid breaking auth flow on logging issues
        pass


class AuthThrottle(ScopedRateThrottle):
    scope = "auth"


class UserThrottle(ScopedRateThrottle):
    scope = "user"


class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [AuthThrottle]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        _log(user, SecurityLog.Action.LOGIN, request) # Using LOGIN action for signup log for now or defined some other
        tokens = _issue_tokens(user)
        return Response({"user": UserSerializer(user).data, **tokens}, status=status.HTTP_201_CREATED)


class ProfileUpdateView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    throttle_classes = [UserThrottle]

    def patch(self, request):
        user = request.user
        serializer = UserSerializer(user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [AuthThrottle]

    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={"request": request})
        try:
            serializer.is_valid(raise_exception=True)
        except DRFValidationError:
            _log(None, SecurityLog.Action.FAILED_LOGIN, request)
            raise
        user: User = serializer.validated_data["user"]

        if user.is_mfa_enabled:
            ticket = secrets.token_urlsafe(32)
            cache_key = f"mfa_ticket:{ticket}"
            cache.set(cache_key, user.pk, timeout=int(os.getenv("MFA_TICKET_TTL", "300")))
            _log(user, SecurityLog.Action.LOGIN_MFA_REQUIRED, request)
            return Response({"mfa_required": True, "mfa_ticket": ticket}, status=status.HTTP_200_OK)

        _log(user, SecurityLog.Action.LOGIN, request)
        tokens = _issue_tokens(user)
        return Response({"user": UserSerializer(user).data, **tokens}, status=status.HTTP_200_OK)


class MFAVerifyView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [AuthThrottle]

    def post(self, request):
        serializer = MFAVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        ticket = serializer.validated_data["mfa_ticket"]
        cache_key = f"mfa_ticket:{ticket}"
        user_id = cache.get(cache_key)
        if not user_id:
            return Response({"detail": "Invalid or expired MFA ticket"}, status=status.HTTP_400_BAD_REQUEST)
        user: User = User.objects.get(pk=user_id)

        ok = False
        totp = serializer.validated_data.get("totp")
        recovery_code = serializer.validated_data.get("recovery_code")
        if totp:
            device = TOTPDevice.objects.filter(user=user, confirmed=True).first()
            if device and device.verify_token(totp):
                ok = True
        if not ok and recovery_code:
            for rc in RecoveryCode.objects.filter(user=user, used_at__isnull=True):
                if check_password(recovery_code, rc.code_hash):
                    rc.used_at = timezone.now()
                    rc.save(update_fields=["used_at"])
                    ok = True
                    break

        if not ok:
            _log(user, SecurityLog.Action.MFA_FAILED, request)
            return Response({"detail": "Invalid TOTP or recovery code"}, status=status.HTTP_400_BAD_REQUEST)

        cache.delete(cache_key)
        _log(user, SecurityLog.Action.LOGIN, request)
        tokens = _issue_tokens(user)
        return Response({"user": UserSerializer(user).data, **tokens}, status=status.HTTP_200_OK)


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [UserThrottle]

    def get(self, request):
        return Response(UserSerializer(request.user).data)


class MFASetupView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [UserThrottle]

    def get(self, request):
        user: User = request.user
        if user.is_mfa_enabled:
            return Response({"detail": "MFA already enabled"}, status=status.HTTP_400_BAD_REQUEST)

        device = TOTPDevice.objects.filter(user=user, confirmed=False).first()
        if not device:
            device = TOTPDevice.objects.create(user=user, confirmed=False, name="default")

        # Build otpauth URI manually to be safe
        issuer = os.getenv("MFA_ISSUER", "Hiigsi Tracker")
        account_name = user.email or user.username
        # Convert device secret to base32 for otpauth URI
        secret_b32 = base64.b32encode(device.bin_key).decode("utf-8").replace("=", "")
        label = f"{issuer}:{account_name}"
        params = f"secret={secret_b32}&issuer={issuer}&period=30&digits=6&algorithm=SHA1"
        otpauth_uri = f"otpauth://totp/{label}?{params}"

        return Response({
            "otpauth_uri": otpauth_uri,
            "issuer": issuer,
            "account_name": account_name,
        })


class MFAEnableView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [UserThrottle]

    def post(self, request):
        user: User = request.user
        if user.is_mfa_enabled:
            return Response({"detail": "MFA already enabled"}, status=status.HTTP_400_BAD_REQUEST)

        data = MFAEnableSerializer(data=request.data)
        data.is_valid(raise_exception=True)
        code = data.validated_data["totp"]

        device = TOTPDevice.objects.filter(user=user, confirmed=False).first()
        if not device:
            return Response({"detail": "No pending MFA device. Call setup first."}, status=status.HTTP_400_BAD_REQUEST)

        if not device.verify_token(code):
            _log(user, SecurityLog.Action.MFA_FAILED, request)
            return Response({"detail": "Invalid TOTP"}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            device.confirmed = True
            device.save(update_fields=["confirmed"])
            user.is_mfa_enabled = True
            user.save(update_fields=["is_mfa_enabled"])
            # Generate recovery codes
            raw_codes = _generate_recovery_codes()
            RecoveryCode.objects.filter(user=user).delete()
            RecoveryCode.objects.bulk_create([
                RecoveryCode(user=user, code_hash=make_password(code)) for code in raw_codes
            ])

        _log(user, SecurityLog.Action.MFA_ENABLED, request)
        return Response({"recovery_codes": raw_codes}, status=status.HTTP_200_OK)


class MFADisableView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [UserThrottle]

    def post(self, request):
        user: User = request.user
        data = MFADisableSerializer(data=request.data)
        data.is_valid(raise_exception=True)

        ok = False
        totp = data.validated_data.get("totp")
        password = data.validated_data.get("password")
        if totp:
            device = TOTPDevice.objects.filter(user=user, confirmed=True).first()
            if device and device.verify_token(totp):
                ok = True
        elif password:
            ok = user.check_password(password)

        if not ok:
            return Response({"detail": "TOTP or password required and must be valid"}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            TOTPDevice.objects.filter(user=user).delete()
            RecoveryCode.objects.filter(user=user).delete()
            user.is_mfa_enabled = False
            user.save(update_fields=["is_mfa_enabled"])

        _log(user, SecurityLog.Action.MFA_DISABLED, request)
        return Response({"status": "disabled"}, status=status.HTTP_200_OK)


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [UserThrottle]

    def post(self, request):
        serializer = LogoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        refresh_token = serializer.validated_data["refresh"]
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except Exception:
            pass
        _log(request.user, SecurityLog.Action.LOGOUT, request)
        return Response({"status": "ok"}, status=status.HTTP_200_OK)


class PasswordChangeView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [UserThrottle]

    def post(self, request):
        serializer = PasswordChangeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = request.user
        if not user.check_password(serializer.validated_data["old_password"]):
            return Response({"old_password": ["Wrong password"]}, status=status.HTTP_400_BAD_REQUEST)
        user.set_password(serializer.validated_data["new_password"])
        user.save()
        _log(user, SecurityLog.Action.PASSWORD_CHANGE, request)
        return Response({"status": "ok"}, status=status.HTTP_200_OK)


def _generate_recovery_codes(n: int = 10) -> List[str]:
    codes = []
    for _ in range(n):
        part1 = secrets.token_hex(3)
        part2 = secrets.token_hex(3)
        codes.append(f"{part1}-{part2}")
    return codes
