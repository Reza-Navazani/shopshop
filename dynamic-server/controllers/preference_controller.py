import json
import logging
from flask import request, jsonify, Blueprint
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy.exc import SQLAlchemyError

# Blueprint for preference routes
preference_routes = Blueprint('preferences', __name__)

# Global variables to store model references (populated in init_routes)
UserModel = None
UserPreferenceModel = None
db = None

def init_preference_routes(user_model, user_preference_model, db_instance):
    """Initialize the routes with the required models"""
    global UserModel, UserPreferenceModel, db
    UserModel = user_model
    UserPreferenceModel = user_preference_model
    db = db_instance

@preference_routes.route('', methods=['GET'])
@jwt_required()
def get_preferences():
    """Get current user's preferences"""
    try:
        user_id = get_jwt_identity()
        
        # Find existing preferences for this user
        preferences = UserPreferenceModel.query.filter_by(user_id=user_id).first()
        
        if not preferences:
            # Return empty preferences if none exist
            return jsonify({
                "success": True,
                "preferences": {
                    "allergies": "",
                    "ingredients_to_avoid": "",
                    "brands_of_interest": "",
                    "price_preference": "",
                    "store_preference": ""
                }
            })
        
        # Return the preferences
        return jsonify({
            "success": True,
            "preferences": preferences.to_dict()
        })
        
    except Exception as e:
        logging.error(f"Error getting preferences: {str(e)}")
        return jsonify({"error": str(e), "success": False}), 500

@preference_routes.route('', methods=['POST'])
@jwt_required()
def save_preferences():
    """Save user preferences"""
    try:
        user_id = get_jwt_identity()
        
        if not request.is_json:
            return jsonify({"error": "Request must be JSON", "success": False}), 400
            
        data = request.get_json()
        
        # Validate data
        for field in ['allergies', 'ingredients_to_avoid', 'brands_of_interest', 'price_preference', 'store_preference']:
            if field not in data:
                data[field] = ""  # Set empty defaults for missing fields
        
        # Find existing preferences for this user
        preferences = UserPreferenceModel.query.filter_by(user_id=user_id).first()
        
        if preferences:
            # Update existing record
            preferences.allergies = data.get('allergies')
            preferences.ingredients_to_avoid = data.get('ingredients_to_avoid')
            preferences.brands_of_interest = data.get('brands_of_interest')
            preferences.price_preference = data.get('price_preference')
            preferences.store_preference = data.get('store_preference')
        else:
            # Create new record
            preferences = UserPreferenceModel(
                user_id=user_id,
                allergies=data.get('allergies'),
                ingredients_to_avoid=data.get('ingredients_to_avoid'),
                brands_of_interest=data.get('brands_of_interest'),
                price_preference=data.get('price_preference'),
                store_preference=data.get('store_preference')
            )
            db.session.add(preferences)
        
        db.session.commit()
        
        return jsonify({
            "success": True,
            "message": "Preferences saved successfully",
            "preferences": preferences.to_dict()
        })
        
    except SQLAlchemyError as e:
        db.session.rollback()
        logging.error(f"Database error saving preferences: {str(e)}")
        return jsonify({"error": "Database error", "success": False}), 500
    except Exception as e:
        logging.error(f"Error saving preferences: {str(e)}")
        return jsonify({"error": str(e), "success": False}), 500