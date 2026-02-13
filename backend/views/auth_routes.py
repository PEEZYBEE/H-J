from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, get_jwt
from datetime import datetime, timezone, timedelta
from app import db, bcrypt
from models import User, TokenBlocklist
from functools import wraps

auth_bp = Blueprint('auth', __name__)

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
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data.get('username') or not data.get('email') or not data.get('password'):
            return jsonify({'success': False, 'error': 'Missing required fields'}), 400
        
        # Check if user exists
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
            role=data.get('role', 'customer')
        )
        user.set_password(data['password'])
        
        db.session.add(user)
        db.session.commit()
        
        # Create token for immediate login
        access_token = create_access_token(
            identity=user.id,
            additional_claims={
                'username': user.username,
                'email': user.email,
                'role': user.role
            }
        )
        
        return jsonify({
            'success': True,
            'message': 'User created successfully',
            'access_token': access_token,
            'user': user.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

# ========== LOGIN ==========
@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        
        if not data.get('username') or not data.get('password'):
            return jsonify({'success': False, 'error': 'Username and password required'}), 400
        
        # Find user
        user = User.query.filter_by(username=data['username']).first()
        
        if not user or not user.check_password(data['password']):
            return jsonify({'success': False, 'error': 'Invalid credentials'}), 401
        
        if not user.is_active:
            return jsonify({'success': False, 'error': 'Account is disabled'}), 403
        
        # Create access token
        access_token = create_access_token(
            identity=user.id,
            additional_claims={
                'username': user.username,
                'email': user.email,
                'role': user.role
            }
        )
        
        return jsonify({
            'success': True,
            'access_token': access_token,
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# ========== LOGOUT ==========
@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    try:
        jti = get_jwt()['jti']
        token = TokenBlocklist(jti=jti, created_at=datetime.now(timezone.utc))
        db.session.add(token)
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'Successfully logged out'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

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
        valid_roles = ['admin', 'manager', 'senior', 'receiver', 'cashier', 'customer']
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
            password_hash=bcrypt.generate_password_hash(data['password']).decode('utf-8'),
            full_name=data.get('full_name', ''),
            phone=data.get('phone', ''),
            role=data['role'],
            is_active=data.get('is_active', True)
        )
        
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
        
        data = request.get_json()
        
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
            valid_roles = ['admin', 'manager', 'senior', 'receiver', 'cashier', 'customer']
            if data['role'] not in valid_roles:
                return jsonify({'success': False, 'error': 'Invalid role'}), 400
            user.role = data['role']
        
        if 'is_active' in data:
            user.is_active = data['is_active']
        
        if 'password' in data and data['password']:
            user.password_hash = bcrypt.generate_password_hash(data['password']).decode('utf-8')
        
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
        roles = ['admin', 'manager', 'senior', 'receiver', 'cashier', 'customer']
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