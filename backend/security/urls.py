from django.urls import path
from .views import (
    WebAuthnRegistrationStartView,
    WebAuthnRegistrationFinishView,
    WebAuthnAuthenticationStartView,
    WebAuthnAuthenticationFinishView,
)

urlpatterns = [
    path("webauthn/register/start/", WebAuthnRegistrationStartView.as_view(), name="webauthn-register-start"),
    path("webauthn/register/finish/", WebAuthnRegistrationFinishView.as_view(), name="webauthn-register-finish"),
    path("webauthn/login/start/", WebAuthnAuthenticationStartView.as_view(), name="webauthn-login-start"),
    path("webauthn/login/finish/", WebAuthnAuthenticationFinishView.as_view(), name="webauthn-login-finish"),
]
