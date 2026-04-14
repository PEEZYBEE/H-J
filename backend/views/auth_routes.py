from flask import Blueprint, request, jsonify, g
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity, get_jwt
from flask import current_app
from flask_mail import Message
from datetime import datetime, timezone, timedelta
from models import User, db
from utils.auth_tokens import generate_token, verify_token
from utils.schemas import AuthLoginSchema
from marshmallow import ValidationError
from functools import wraps
import os
import re
import secrets

from google.auth.transport import requests as google_requests
from google.oauth2 import id_token

auth_bp = Blueprint('auth', __name__)


def _generate_unique_username(email, full_name=''):
    """Generate a unique username derived from name/email."""
    base_source = (full_name or '').strip() or email.split('@')[0]
    normalized = re.sub(r'[^a-zA-Z0-9_]+', '_', base_source).strip('_').lower()
    base = normalized[:40] if normalized else 'user'

    candidate = base
    suffix = 1
    while User.query.filter_by(username=candidate).first():
        candidate = f"{base}_{suffix}"
        suffix += 1

    return candidate


def _build_auth_response(user, status_code=200, message=None):
    """Build a standard auth response with JWT token and user payload."""
    access_token = create_access_token(
        identity=user.id,
        additional_claims={
            'username': user.username,
            'email': user.email,
            'role': user.role
        }
    )
    refresh_token = create_refresh_token(identity=user.id)

    payload = {
        'success': True,
        'access_token': access_token,
        'refresh_token': refresh_token,
        'user': user.to_dict()
    }
    if message:
        payload['message'] = message

    return jsonify(payload), status_code

# ========== ROLE-BASED PERMISSION DECORATOR ==========
def role_required(required_roles):
    """Decorator to check user role"""
    def decorator(f):
        @wraps(f)
        @jwt_required()
        def decorated_function(*args, **kwargs):
            current_user_id = get_jwt_identity()
            user = User.query.get(current_user_id)
            
            if not user:
                return jsonify({'success': False, 'error': 'User not found'}), 404
            
            if user.role not in required_roles:
                return jsonify({'success': False, 'error': 'Insufficient permissions'}), 403
            
            # Pass the user object as first argument
            return f(user, *args, **kwargs)
        return decorated_function
    return decorator

# ========== REGISTER ==========
@auth_bp.route('/register', methods=['POST'])
def register():
    return jsonify({
        'success': False,
        'error': 'Self-registration is disabled. Please contact an admin to create your account.'
    }), 403

# ========== LOGIN ==========
@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = getattr(g, 'sanitized_json', None) or request.get_json(silent=True)
        try:
            data = AuthLoginSchema().load(data or {})
        except ValidationError as ve:
            return jsonify({'success': False, 'error': 'Invalid input', 'messages': ve.messages}), 400
        
        if not data.get('username') or not data.get('password'):
            return jsonify({'success': False, 'error': 'Username and password required'}), 400
        
        # Find user
        user = User.query.filter_by(username=data['username']).first()
        
        # Check if account is locked due to repeated failures
        now = datetime.utcnow()
        if user and getattr(user, 'locked_until', None) and user.locked_until > now:
            current_app.logger.warning('Locked login attempt username=%s ip=%s locked_until=%s', data.get('username'), request.remote_addr, user.locked_until)
            return jsonify({'success': False, 'error': 'Account temporarily locked due to failed login attempts'}), 403

        if not user or not user.check_password(data['password']):
            # Increment failed attempts if user exists
            if user:
                try:
                    user.failed_login_attempts = (user.failed_login_attempts or 0) + 1
                    # Lock after 5 failed attempts for 15 minutes
                    if user.failed_login_attempts >= int(os.getenv('MAX_FAILED_LOGIN', 5)):
                        user.locked_until = now + timedelta(minutes=int(os.getenv('LOCK_MINUTES', 15)))
                    from models import db
                    db.session.add(user)
                    db.session.commit()
                except Exception:
                    pass

            current_app.logger.warning('Failed login username=%s ip=%s', data.get('username'), request.remote_addr)
            return jsonify({'success': False, 'error': 'Invalid credentials'}), 401
        
        if not user.is_active:
            return jsonify({'success': False, 'error': 'Account is disabled'}), 403

        # Email verification is not required for login
        
        # Reset failed attempts on successful login
        try:
            user.failed_login_attempts = 0
            user.locked_until = None
            from models import db
            db.session.add(user)
            db.session.commit()
        except Exception:
            pass

        # Create access + refresh tokens
        access_token = create_access_token(identity=user.id, additional_claims={'username': user.username, 'email': user.email, 'role': user.role})
        refresh_token = create_refresh_token(identity=user.id)

        current_app.logger.info('Successful login user_id=%s username=%s ip=%s', user.id, user.username, request.remote_addr)
        return jsonify({'success': True, 'access_token': access_token, 'refresh_token': refresh_token, 'user': user.to_dict()}), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# ========== GOOGLE AUTH (LOGIN / REGISTER) ==========
@auth_bp.route('/google', methods=['POST'])
def google_auth():
    try:
        data = request.get_json() or {}
        credential = data.get('credential')
        action = (data.get('action') or 'login').strip().lower()
        selected_role = (data.get('role') or '').strip().lower()
        phone = (data.get('phone') or '').strip()

        if action not in ['login', 'register']:
            return jsonify({'success': False, 'error': 'Invalid action'}), 400

        if action == 'register':
            return jsonify({
                'success': False,
                'error': 'Self-registration is disabled. Please contact an admin to create your account.'
            }), 403

        if not credential:
            return jsonify({'success': False, 'error': 'Missing Google credential'}), 400

        google_client_id = os.getenv('GOOGLE_CLIENT_ID', '').strip()
        if not google_client_id:
            return jsonify({'success': False, 'error': 'Google login is not configured on server'}), 500

        try:
            id_info = id_token.verify_oauth2_token(
                credential,
                google_requests.Request(),
                google_client_id
            )
        except ValueError:
            return jsonify({'success': False, 'error': 'Invalid Google token'}), 401

        if not id_info.get('email_verified'):
            return jsonify({'success': False, 'error': 'Google email is not verified'}), 400

        email = (id_info.get('email') or '').strip().lower()
        full_name = (id_info.get('name') or '').strip()

        if not email:
            return jsonify({'success': False, 'error': 'Google account email not available'}), 400

        user = User.query.filter_by(email=email).first()

        if action == 'login':
            if not user:
                current_app.logger.warning('Google login attempted for unknown email=%s ip=%s', email, request.remote_addr)
                return jsonify({'success': False, 'error': 'No account found for this Google email. Please contact an admin to create your account.'}), 404

            if not user.is_active:
                return jsonify({'success': False, 'error': 'Account is disabled'}), 403

            current_app.logger.info('Google login successful user_id=%s email=%s ip=%s', user.id, email, request.remote_addr)
            return _build_auth_response(user, message='Google login successful')

        return jsonify({'success': False, 'error': 'Invalid action'}), 400

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

# ========== LOGOUT ==========
@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    try:
        jti = get_jwt()['jti']
        from models import TokenBlocklist, db
        token = TokenBlocklist(jti=jti, created_at=datetime.now(timezone.utc))
        db.session.add(token)
        db.session.commit()
        current_app.logger.info('Logout token jti=%s ip=%s', jti, request.remote_addr)
        return jsonify({'success': True, 'message': 'Successfully logged out'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


# ========== EMAIL VERIFICATION ==========
@auth_bp.route('/verify-email', methods=['GET', 'POST'])
def verify_email():
    try:
        token = request.args.get('token') or (request.get_json() or {}).get('token')
        if not token:
            return jsonify({'success': False, 'error': 'Missing token'}), 400

        # Token expires in 24 hours
        data = verify_token(token, 'email-verify', max_age=60 * 60 * 24)
        user_id = data.get('user_id')
        from models import db
        user = User.query.get(user_id)
        if not user:
            return jsonify({'success': False, 'error': 'User not found'}), 404

        user.is_email_verified = True
        user.email_verified_at = datetime.utcnow()
        db.session.add(user)
        db.session.commit()
        current_app.logger.info('Email verified user_id=%s email=%s ip=%s', user.id, user.email, request.remote_addr)
        return jsonify({'success': True, 'message': 'Email verified successfully'}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400


# ========== RESEND VERIFICATION ==========
@auth_bp.route('/resend-verification', methods=['POST'])
def resend_verification():
    try:
        data = request.get_json() or {}
        email = (data.get('email') or '').strip().lower()
        if not email:
            return jsonify({'success': False, 'error': 'Email is required'}), 400

        user = User.query.filter_by(email=email).first()
        if not user:
            return jsonify({'success': False, 'error': 'No account with that email'}), 404

        if user.is_email_verified:
            return jsonify({'success': False, 'error': 'Email already verified'}), 400

        token = generate_token({'user_id': user.id, 'email': user.email}, 'email-verify')
        frontend = os.getenv('FRONTEND_URL', '').rstrip('/')
        verify_url = f"{frontend}/verify-email?token={token}" if frontend else f"/api/auth/verify-email?token={token}"
        msg = Message(subject='Verify your email', recipients=[user.email])
        msg.body = f"Verify your email: {verify_url}\nIf you did not request this, ignore this message."
        from app import mail
        mail.send(msg)
        current_app.logger.info('Resent verification email user_id=%s email=%s ip=%s', user.id, user.email, request.remote_addr)
        return jsonify({'success': True, 'message': 'Verification email sent'}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# ========== PASSWORD RESET (REQUEST) ==========
@auth_bp.route('/request-password-reset', methods=['POST'])
def request_password_reset():
    try:
        data = request.get_json() or {}
        email = (data.get('email') or '').strip().lower()
        if not email:
            return jsonify({'success': False, 'error': 'Email is required'}), 400

        user = User.query.filter_by(email=email).first()
        if not user:
            # Do not reveal whether the email exists
            current_app.logger.info('Password reset requested for unknown email=%s ip=%s', email, request.remote_addr)
            return jsonify({'success': True, 'message': 'If an account exists, a reset email has been sent'}), 200

        token = generate_token({'user_id': user.id}, 'password-reset')
        frontend = os.getenv('FRONTEND_URL', '').rstrip('/')
        reset_url = f"{frontend}/reset-password?token={token}" if frontend else f"/api/auth/reset-password?token={token}"
        msg = Message(subject='Password reset', recipients=[user.email])
        msg.body = f"Reset your password: {reset_url}\nThis link expires in 2 hours. If you did not request this, ignore."
        from app import mail
        mail.send(msg)
        current_app.logger.info('Password reset requested user_id=%s email=%s ip=%s', user.id, user.email, request.remote_addr)
        return jsonify({'success': True, 'message': 'If an account exists, a reset email has been sent'}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# ========== PASSWORD RESET (CONFIRM) ==========
@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    try:
        data = request.get_json() or {}
        token = data.get('token') or request.args.get('token')
        new_password = data.get('password')
        if not token or not new_password:
            return jsonify({'success': False, 'error': 'Token and new password are required'}), 400

        # Token valid for 2 hours
        payload = verify_token(token, 'password-reset', max_age=60 * 60 * 2)
        user_id = payload.get('user_id')
        from models import db
        user = User.query.get(user_id)
        if not user:
            return jsonify({'success': False, 'error': 'User not found'}), 404

        user.set_password(new_password)
        # Reset failed attempts / locks
        user.failed_login_attempts = 0
        user.locked_until = None
        db.session.add(user)
        db.session.commit()
        current_app.logger.info('Password reset completed user_id=%s ip=%s', user.id, request.remote_addr)

        return jsonify({'success': True, 'message': 'Password reset successfully'}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

# ========== GET CURRENT USER ==========
@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        
        return jsonify({'success': True, 'user': user.to_dict()}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# ========== REFRESH TOKEN ==========
@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        
        new_token = create_access_token(
            identity=user.id,
            additional_claims={
                'username': user.username,
                'email': user.email,
                'role': user.role
            }
        )
        
        return jsonify({'success': True, 'access_token': new_token}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# ========== GET ALL USERS (Admin/Manager only) ==========
@auth_bp.route('/users', methods=['GET'])
@jwt_required()
def get_all_users():
    try:
        user_id = get_jwt_identity()
        current_user = User.query.get(user_id)
        
        # Allow admin and manager to see users
        if current_user.role not in ['admin', 'manager']:
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403
        
        # Get query parameters
        role_filter = request.args.get('role')
        search = request.args.get('search', '').strip()
        is_active = request.args.get('is_active')
        
        # Build query
        query = User.query
        
        # Apply filters
        if role_filter:
            query = query.filter_by(role=role_filter)
        
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                db.or_(
                    User.username.ilike(search_term),
                    User.email.ilike(search_term),
                    User.full_name.ilike(search_term)
                )
            )
        
        if is_active is not None:
            is_active_bool = is_active.lower() == 'true'
            query = query.filter_by(is_active=is_active_bool)
        
        # Exclude the current user from results (optional)
        # query = query.filter(User.id != current_user.id)
        
        users = query.order_by(User.created_at.desc()).all()
        
        return jsonify({
            'success': True,
            'users': [user.to_dict() for user in users]
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# ========== CREATE USER (Admin/Manager only) ==========
@auth_bp.route('/users', methods=['POST'])
@role_required(['admin', 'manager'])
def create_user(current_user):
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['username', 'email', 'password', 'role']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'success': False, 'error': f'{field} is required'}), 400
        
        # Validate role
        valid_roles = ['admin', 'manager', 'senior', 'receiver', 'cashier', 'customer', 'errand']
        if data['role'] not in valid_roles:
            return jsonify({'success': False, 'error': 'Invalid role specified'}), 400
        
        # Check for existing user
        if User.query.filter_by(username=data['username']).first():
            return jsonify({'success': False, 'error': 'Username already exists'}), 400
        
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'success': False, 'error': 'Email already exists'}), 400
        
        # Create new user
        user = User(
            username=data['username'],
            email=data['email'],
            full_name=data.get('full_name', ''),
            phone=data.get('phone', ''),
            role=data['role'],
            is_active=data.get('is_active', True)
        )
        user.set_password(data['password'])
        from models import db
        db.session.add(user)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'User created successfully',
            'user': user.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

# ========== GET SINGLE USER ==========
@auth_bp.route('/users/<int:user_id>', methods=['GET'])
@role_required(['admin', 'manager'])
def get_user(current_user, user_id):
    try:
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        
        return jsonify({
            'success': True,
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# ========== UPDATE USER ==========
@auth_bp.route('/users/<int:user_id>', methods=['PUT'])
@role_required(['admin', 'manager'])
def update_user(current_user, user_id):
    try:
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        
        data = request.get_json(silent=True) or {}
        if not isinstance(data, dict):
            return jsonify({'success': False, 'error': 'Invalid request payload'}), 400
        
        # Prevent admin from modifying their own role/status via API (safety)
        if user.id == current_user.id and data.get('role'):
            return jsonify({'success': False, 'error': 'Cannot modify your own role'}), 403
        
        # Update fields
        if 'username' in data and data['username'] != user.username:
            if User.query.filter_by(username=data['username']).first():
                return jsonify({'success': False, 'error': 'Username already exists'}), 400
            user.username = data['username']
        
        if 'email' in data and data['email'] != user.email:
            if User.query.filter_by(email=data['email']).first():
                return jsonify({'success': False, 'error': 'Email already exists'}), 400
            user.email = data['email']
        
        if 'full_name' in data:
            user.full_name = data['full_name']
        
        if 'phone' in data:
            user.phone = data['phone']
        
        if 'role' in data:
            valid_roles = ['admin', 'manager', 'senior', 'receiver', 'cashier', 'customer', 'errand']
            if data['role'] not in valid_roles:
                return jsonify({'success': False, 'error': 'Invalid role'}), 400
            user.role = data['role']
        
        if 'is_active' in data:
            user.is_active = data['is_active']
        
        if 'password' in data and data['password']:
            user.set_password(data['password'])
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'User updated successfully',
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

# ========== DELETE USER ==========
@auth_bp.route('/users/<int:user_id>', methods=['DELETE'])
@role_required(['admin'])
def delete_user(current_user, user_id):
    try:
        # Prevent admin from deleting themselves
        if current_user.id == user_id:
            return jsonify({'success': False, 'error': 'Cannot delete your own account'}), 403
        
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        
        db.session.delete(user)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'User deleted successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

# ========== DEACTIVATE/ACTIVATE USER ==========
@auth_bp.route('/users/<int:user_id>/toggle-active', methods=['POST'])
@role_required(['admin', 'manager'])
def toggle_user_active(current_user, user_id):
    try:
        # Prevent admin from deactivating themselves
        if current_user.id == user_id:
            return jsonify({'success': False, 'error': 'Cannot modify your own account status'}), 403
        
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        
        # Toggle active status
        user.is_active = not user.is_active
        db.session.commit()
        
        status = "activated" if user.is_active else "deactivated"
        
        return jsonify({
            'success': True,
            'message': f'User {status} successfully',
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

# ========== GET USER STATS ==========
@auth_bp.route('/users/stats', methods=['GET'])
@role_required(['admin', 'manager'])
def get_user_stats(current_user):
    try:
        # Count users by role
        roles = ['admin', 'manager', 'senior', 'receiver', 'cashier', 'customer', 'errand']
        stats = {}
        
        for role in roles:
            count = User.query.filter_by(role=role).count()
            active_count = User.query.filter_by(role=role, is_active=True).count()
            stats[role] = {
                'total': count,
                'active': active_count,
                'inactive': count - active_count
            }
        
        # Overall stats
        total_users = User.query.count()
        active_users = User.query.filter_by(is_active=True).count()
        
        return jsonify({
            'success': True,
            'stats': {
                'total_users': total_users,
                'active_users': active_users,
                'inactive_users': total_users - active_users,
                'by_role': stats
            }
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# ========== CHANGE PASSWORD ==========
@auth_bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        
        data = request.get_json()
        
        if not data.get('current_password'):
            return jsonify({'success': False, 'error': 'Current password is required'}), 400
        
        if not user.check_password(data['current_password']):
            return jsonify({'success': False, 'error': 'Current password is incorrect'}), 401
        
        if not data.get('new_password'):
            return jsonify({'success': False, 'error': 'New password is required'}), 400
        
        if len(data['new_password']) < 6:
            return jsonify({'success': False, 'error': 'New password must be at least 6 characters'}), 400
        
        user.set_password(data['new_password'])
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Password changed successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500