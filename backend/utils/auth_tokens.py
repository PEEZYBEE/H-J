from itsdangerous import URLSafeTimedSerializer
from flask import current_app


def _get_serializer():
    secret = current_app.config.get('SECRET_KEY') or current_app.config.get('JWT_SECRET_KEY')
    return URLSafeTimedSerializer(secret)


def generate_token(payload: dict, purpose: str) -> str:
    """Generate a signed token for a given payload and purpose."""
    s = _get_serializer()
    data = {'p': purpose, 'd': payload}
    return s.dumps(data)


def verify_token(token: str, purpose: str, max_age: int):
    """Verify a token and return the payload if valid and not expired.

    Raises itsdangerous.SignatureExpired or BadSignature on failure.
    """
    s = _get_serializer()
    data = s.loads(token, max_age=max_age)
    if not isinstance(data, dict) or data.get('p') != purpose:
        raise ValueError('Invalid token purpose')
    return data.get('d')
