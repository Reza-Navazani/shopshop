from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, decode_token, get_jwt
import json
import re
import logging
import datetime

# Set up logger
logger = logging.getLogger(__name__)

# Create a function to generate the auth blueprint with the UserModel passed in
def create_auth_blueprint(UserModel, db):
    auth_bp = Blueprint('auth', __name__)

    # Helper functions
    def is_valid_email(email):
        """Check if the email has a valid format"""
        pattern = r'^[\w\.-]+@[\w\.-]+\.\w+$'
        return re.match(pattern, email) is not None

    def is_strong_password(password):
        """Check if the password is at least 8 characters"""
        return len(password) >= 8

    @auth_bp.route('/register', methods=['POST'])
    def register():
        """Register a new user"""
        data = request.get_json()
        
        # Input validation
        required_fields = ['username', 'email', 'password']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Email validation
        if not is_valid_email(data['email']):
            return jsonify({'error': 'Invalid email format'}), 400
        
        # Password strength
        if not is_strong_password(data['password']):
            return jsonify({'error': 'Password must be at least 8 characters long'}), 400
        
        # Check if user already exists
        if UserModel.query.filter_by(username=data['username']).first():
            return jsonify({'error': 'Username already exists'}), 409
        
        if UserModel.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email already registered'}), 409
        
        # Create new user
        new_user = UserModel(
            username=data['username'],
            email=data['email'],
            first_name=data.get('first_name'),
            last_name=data.get('last_name')
        )
        new_user.set_password(data['password'])
        
        try:
            db.session.add(new_user)
            db.session.commit()
            
            # Generate JWT token
            access_token = create_access_token(identity=new_user.id)
            
            return jsonify({
                'message': 'User registered successfully',
                'access_token': access_token,
                'user': new_user.to_dict()
            }), 201
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Error registering user: {str(e)}")
            return jsonify({'error': 'Registration failed'}), 500

    @auth_bp.route('/login', methods=['POST'])
    def login():
        """Login a user and return a JWT token"""
        data = request.get_json()
        
        # Input validation
        if not data.get('username') or not data.get('password'):
            return jsonify({'error': 'Username and password required'}), 400
        
        # Find user by username
        user = UserModel.query.filter_by(username=data['username']).first()
        
        # Check password
        if user and user.check_password(data['password']):
            try:
                # Create a token with minimal claims for better security
                # Use only the user ID as the identity
                expires = datetime.timedelta(days=1)
                
                # Create a simple token with just the user ID
                access_token = create_access_token(
                    identity=str(user.id),  # Convert to string for consistency
                    expires_delta=expires,
                    fresh=True
                )
                
                # Log successful login
                logger.info(f"User {user.username} logged in successfully")
                
                # Return the token and user data
                return jsonify({
                    'message': 'Login successful',
                    'access_token': access_token,
                    'user': user.to_dict()
                })
            except Exception as e:
                logger.exception(f"Error creating JWT token: {str(e)}")
                return jsonify({'error': f'Login failed: {str(e)}'}), 500
        
        # Log failed login attempt
        if user:
            logger.warning(f"Failed login attempt for user: {data['username']} (invalid password)")
        else:
            logger.warning(f"Failed login attempt for nonexistent user: {data['username']}")
            
        return jsonify({'error': 'Invalid username or password'}), 401

    @auth_bp.route('/profile', methods=['GET'])
    @jwt_required()
    def get_profile():
        """Get the user's profile"""
        user_id = get_jwt_identity()
        user = UserModel.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify(user.to_dict())

    @auth_bp.route('/profile', methods=['PUT'])
    @jwt_required()
    def update_profile():
        """Update user profile"""
        user_id = get_jwt_identity()
        user = UserModel.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        
        # Update allowed fields
        updatable_fields = ['first_name', 'last_name', 'profile_picture', 'preferred_store', 'dietary_preferences']
        
        for field in updatable_fields:
            if field in data:
                setattr(user, field, data[field])
        
        try:
            db.session.commit()
            return jsonify({
                'message': 'Profile updated successfully',
                'user': user.to_dict()
            })
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Error updating profile: {str(e)}")
            return jsonify({'error': 'Failed to update profile'}), 500

    @auth_bp.route('/verify', methods=['GET'])
    @jwt_required()
    def verify_token():
        """Verify that the JWT token is valid and return user info"""
        try:
            # Extract the token from the Authorization header for debugging
            auth_header = request.headers.get('Authorization', '')
            token = None
            if auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]
                logger.info(f"Received token for verification: {token[:10]}...")
            else:
                logger.warning("No bearer token found in Authorization header")
            
            # Get the identity from the token
            user_id = get_jwt_identity()
            logger.info(f"Raw user_id from token: {user_id}, type: {type(user_id)}")
            
            # Handle string/int conversion carefully
            if isinstance(user_id, str) and user_id.isdigit():
                user_id = int(user_id)
                logger.info(f"Converted user_id to int: {user_id}")
            
            # Get JWT claims for debugging
            try:
                jwt_claims = get_jwt()
                logger.info(f"JWT claims: {jwt_claims}")
            except Exception as e:
                logger.error(f"Error getting JWT claims: {str(e)}")
            
            # Check if user exists
            user = UserModel.query.get(user_id)
            
            if not user:
                logger.warning(f"Token verification failed: User ID {user_id} not found in database")
                return jsonify({'error': 'User not found'}), 404
            
            logger.info(f"Token verified successfully for user: {user.username}")
            return jsonify({
                'message': 'Token is valid',
                'user_id': user_id,
                'username': user.username
            })
        
        except Exception as e:
            logger.exception(f"Token verification error: {str(e)}")
            return jsonify({'error': f'Token verification failed: {str(e)}'}), 401

    @auth_bp.route('/refresh-token', methods=['POST'])
    @jwt_required()
    def refresh_token():
        """Generate a new token for the authenticated user"""
        try:
            current_user_id = get_jwt_identity()
            user = UserModel.query.get(current_user_id)
            
            if not user:
                logger.warning(f"Token refresh failed: User ID {current_user_id} not found")
                return jsonify({'error': 'User not found'}), 404
                
            # Create a new token
            expires = datetime.timedelta(days=1)
            new_token = create_access_token(
                identity=current_user_id,
                expires_delta=expires
            )
            
            logger.info(f"Token refreshed for user: {user.username}")
            
            return jsonify({
                'message': 'Token refreshed successfully',
                'access_token': new_token,
                'user': user.to_dict()
            })
            
        except Exception as e:
            logger.exception(f"Token refresh error: {str(e)}")
            return jsonify({'error': f'Token refresh failed: {str(e)}'}), 500
            
    return auth_bp