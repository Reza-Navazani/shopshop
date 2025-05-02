from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import logging

# Set up logger
logger = logging.getLogger(__name__)

user_product_routes = Blueprint('user_product_routes', __name__)

UserModel = None
UserProductModel = None

def init_product_routes(user_model, user_product_model):
    global UserModel, UserProductModel
    UserModel = user_model
    UserProductModel = user_product_model

@user_product_routes.route('/scan', methods=['POST'])
@jwt_required()
def save_product_scan():
    """Save a product scan to the database"""
    try:
        current_user_id = get_jwt_identity()
        logger.info(f"User ID from token: {current_user_id}")
        
        # Log the request headers for debugging
        logger.info(f"Request headers: {dict(request.headers)}")
        
        # Get and log the request data
        data = request.json
        logger.info(f"Received data: {data}")
        
        if not data:
            logger.error("Request data is None or empty")
            return jsonify({'error': 'No data provided'}), 400
            
        if 'barcode' not in data:
            logger.error("Missing 'barcode' field in request data")
            return jsonify({'error': 'Missing barcode field'}), 400
            
        if 'product_name' not in data:
            logger.error("Missing 'product_name' field in request data")
            return jsonify({'error': 'Missing product_name field'}), 400
        
        # Validate user_id
        user = UserModel.query.get(current_user_id)
        if not user:
            logger.error(f"User with ID {current_user_id} not found in database")
            return jsonify({'error': 'User not found'}), 404
        
        try:
            # Create new product scan record
            new_scan = UserProductModel(
                user_id=current_user_id,
                barcode=data['barcode'],
                product_name=data['product_name']
            )
            
            # Log the new scan object details
            logger.info(f"Created new scan: user_id={current_user_id}, barcode={data['barcode']}, product_name={data['product_name']}")
            
            # Add to database
            from main import db
            db.session.add(new_scan)
            db.session.commit()
            
            # Convert the scan to a dict and log it
            scan_dict = new_scan.to_dict()
            logger.info(f"Scan saved successfully: {scan_dict}")
            
            return jsonify({'message': 'Product scan saved successfully', 'scan': scan_dict}), 201
        
        except Exception as e:
            from main import db
            db.session.rollback()
            logger.exception(f"Database error: {str(e)}")
            return jsonify({'error': f'Failed to save product scan: {str(e)}'}), 500
    
    except Exception as e:
        logger.exception(f"General error in save_product_scan: {str(e)}")
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@user_product_routes.route('/scans', methods=['GET'])
@jwt_required()
def get_user_scans():
    """Get all product scans for the current user"""
    current_user_id = get_jwt_identity()
    
    try:
        # Retrieve all scans for the current user
        scans = UserProductModel.query.filter_by(user_id=current_user_id).all()
        return jsonify({
            'scans': [scan.to_dict() for scan in scans]
        }), 200
    
    except Exception as e:
        return jsonify({'error': f'Failed to retrieve product scans: {str(e)}'}), 500

@user_product_routes.route('/all-scans', methods=['GET'])
@jwt_required()
def get_all_scans():
    """Get all product scans (admin only)"""
    current_user_id = get_jwt_identity()
    
    # Check if user is admin
    user = UserModel.query.get(current_user_id)
    if not user or not user.is_admin:
        return jsonify({'error': 'Unauthorized access'}), 403
    
    try:
        # Retrieve all scans with user information
        scans = UserProductModel.query.all()
        return jsonify({
            'scans': [scan.to_dict() for scan in scans]
        }), 200
    
    except Exception as e:
        return jsonify({'error': f'Failed to retrieve product scans: {str(e)}'}), 500