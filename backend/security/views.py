import base64
import json
from django.conf import settings
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status
from webauthn import (
    generate_registration_options,
    verify_registration_response,
    options_to_json,
    base64url_to_bytes,
    generate_authentication_options,
    verify_authentication_response,
)
from webauthn.helpers.structs import (
    AuthenticatorSelectionCriteria,
    UserVerificationRequirement,
    RegistrationCredential,
    AuthenticationCredential,
    AuthenticatorAttachment,
)

from .models import WebAuthnCredential
from django.contrib.auth import get_user_model

User = get_user_model()

def bytes_to_base64url(data):
    return base64.urlsafe_b64encode(data).decode('utf-8').rstrip('=')

class WebAuthnRegistrationStartView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        
        # Get existing credentials to exclude
        user_credentials = WebAuthnCredential.objects.filter(user=user)
        exclude_credentials = []
        for cred in user_credentials:
            exclude_credentials.append({
                "id": base64url_to_bytes(cred.credential_id),
                "type": "public-key",
                "transports": cred.transports.split(",") if cred.transports else None,
            })
            
        options = generate_registration_options(
            rp_id=settings.WEBAUTHN_RP_ID,
            rp_name=settings.WEBAUTHN_RP_NAME,
            user_id=str(user.id).encode(),
            user_name=user.username,
            user_display_name=user.display_name,
            authenticator_selection=AuthenticatorSelectionCriteria(
                user_verification=UserVerificationRequirement.PREFERRED,
                authenticator_attachment=AuthenticatorAttachment.PLATFORM, 
                # "authenticator_attachment=AuthenticatorAttachment.PLATFORM" forces platform authenticator (TouchID, FaceID, Windows Hello)
                # If we want to allow cross-platform (YubiKey), we should remove this or make it optional.
                # User asked for "lockscreen eg finger,pattern", which implies Platform Authenticator.
            ),
            exclude_credentials=exclude_credentials,
        )
        
        # Store challenge in session
        request.session["webauthn_challenge"] = bytes_to_base64url(options.challenge)
        
        return Response(json.loads(options_to_json(options)))

class WebAuthnRegistrationFinishView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        challenge = request.session.get("webauthn_challenge")
        if not challenge:
            return Response({"detail": "Challenge not found"}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            credential = RegistrationCredential.parse_raw(json.dumps(request.data))
            
            challenge_bytes = base64url_to_bytes(challenge)

            verification = verify_registration_response(
                credential=credential,
                expected_challenge=challenge_bytes,
                expected_rp_id=settings.WEBAUTHN_RP_ID,
                expected_origin=settings.WEBAUTHN_ORIGIN,
            )
            
            # Save credential
            cred_id_b64 = bytes_to_base64url(verification.credential_id)
            
            WebAuthnCredential.objects.create(
                user=request.user,
                credential_id=cred_id_b64,
                public_key=bytes_to_base64url(verification.credential_public_key),
                sign_count=verification.sign_count,
                name=request.data.get("name", "Device Passkey"),
                # We can try to extract transports if sent by client, but it's optional
            )
            
            return Response({"detail": "Passkey registered successfully"})
            
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class WebAuthnAuthenticationStartView(APIView):
    permission_classes = [AllowAny] # Allow login

    def post(self, request):
        # We might need username to find user credentials, or we can use discoverable credentials (resident keys).
        # For simplicity, let's assume we ask for username first, or we are just doing MFA for logged in user?
        # User said "allow the person to secure its account the his or her devices lockscreen".
        # This could mean MFA (2nd factor) or Passwordless login.
        # "secure its account" usually implies adding a lock.
        
        # If the user is already authenticated (MFA setup/verify inside profile), we use request.user.
        # If this is for Login, we need username.
        
        # Let's support both.
        user = None
        if request.user.is_authenticated:
            user = request.user
        elif "username" in request.data:
            try:
                user = User.objects.get(username=request.data["username"])
            except User.DoesNotExist:
                pass # Don't reveal user existence? Or return error?
        
        allow_credentials = []
        if user:
            user_credentials = WebAuthnCredential.objects.filter(user=user)
            for cred in user_credentials:
                allow_credentials.append({
                    "id": base64url_to_bytes(cred.credential_id),
                    "type": "public-key",
                    "transports": cred.transports.split(",") if cred.transports else None,
                })
        
        options = generate_authentication_options(
            rp_id=settings.WEBAUTHN_RP_ID,
            allow_credentials=allow_credentials if allow_credentials else None, # If None, allows any credential (resident key)
            user_verification=UserVerificationRequirement.PREFERRED,
        )
        
        request.session["webauthn_challenge"] = bytes_to_base64url(options.challenge)
        if user:
            request.session["webauthn_user_id"] = str(user.id)
            
        return Response(json.loads(options_to_json(options)))

class WebAuthnAuthenticationFinishView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        challenge = request.session.get("webauthn_challenge")
        if not challenge:
            return Response({"detail": "Challenge not found"}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            credential = AuthenticationCredential.parse_raw(json.dumps(request.data))
            challenge_bytes = base64url_to_bytes(challenge)
            
            # We need to find the credential in DB to get public key and sign count
            cred_id_b64 = bytes_to_base64url(credential.id)
            
            try:
                db_cred = WebAuthnCredential.objects.get(credential_id=cred_id_b64)
            except WebAuthnCredential.DoesNotExist:
                return Response({"detail": "Credential not found"}, status=status.HTTP_400_BAD_REQUEST)
            
            verification = verify_authentication_response(
                credential=credential,
                expected_challenge=challenge_bytes,
                expected_rp_id=settings.WEBAUTHN_RP_ID,
                expected_origin=settings.WEBAUTHN_ORIGIN,
                credential_public_key=base64url_to_bytes(db_cred.public_key),
                credential_current_sign_count=db_cred.sign_count,
            )
            
            # Update sign count
            db_cred.sign_count = verification.new_sign_count
            db_cred.last_used_at = timezone.now()
            db_cred.save()
            
            # If successful, log the user in if not already
            if not request.user.is_authenticated:
                # We need to manually issue tokens since we are using JWT
                from accounts.views import _issue_tokens, _log
                from security.models import SecurityLog
                
                user = db_cred.user
                tokens = _issue_tokens(user)
                _log(user, SecurityLog.Action.LOGIN, request)
                
                return Response({"user": {"username": user.username, "email": user.email, "id": user.id}, **tokens})
            
            return Response({"detail": "Authenticated successfully"})
            
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
