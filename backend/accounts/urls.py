from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    LoginView,
    MFAVerifyView,
    MeView,
    MFASetupView,
    MFAEnableView,
    MFADisableView,
    LogoutView,
    RegisterView,
    ProfileUpdateView,
    PasswordChangeView,
)

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("mfa/verify/", MFAVerifyView.as_view(), name="mfa-verify"),
    path("me/", MeView.as_view(), name="me"),
    path("profile/update/", ProfileUpdateView.as_view(), name="profile-update"),
    path("password-change/", PasswordChangeView.as_view(), name="password-change"),
    path("mfa/setup/", MFASetupView.as_view(), name="mfa-setup"),
    path("mfa/enable/", MFAEnableView.as_view(), name="mfa-enable"),
    path("mfa/disable/", MFADisableView.as_view(), name="mfa-disable"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
]
