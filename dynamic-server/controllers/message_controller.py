import json
import logging
import traceback
import os
from flask import jsonify, request, Blueprint, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from services.github_llm_service import GitHubLLMService
from services.product_comparison_service import ProductComparisonService
from config import Config

message_routes = Blueprint('messages', __name__)
comparison_service = None

class MessageController:
    def __init__(self):
        self.comparison_service = None

    def set_comparison_service(self, service: ProductComparisonService):
        self.comparison_service = service

def init_routes(service: ProductComparisonService):
    global comparison_service
    comparison_service = service

@message_routes.route('/api/send-message', methods=['POST'])
@jwt_required(optional=True)  # Optional to allow non-authenticated users
def process_message():
    try:
        # Get the current user (if authenticated)
        user_id = get_jwt_identity()
        
        if not request.is_json:
            logging.warning("Request was not JSON")
            return jsonify({"error": "Request must be JSON"}), 400
            
        data = request.get_json()
        
        if not data or 'message' not in data:
            logging.warning("Missing 'message' field in request")
            return jsonify({"error": "Missing 'message' field"}), 400
            
        message = data.get('message', '')
        session_id = data.get('sessionId', f'session-{user_id}-{os.urandom(8).hex()}')
        
        # Add user_id to the context (for future use)
        context = {
            'user_id': user_id,
            'session_id': session_id
        }
        
        if not comparison_service:
            logging.error("Comparison service not initialized")
            return jsonify({"error": "Service not available"}), 503
        
        # Call the process_message method instead of compare_products
        # The context is not used by process_message currently, but might be in the future
        response = comparison_service.process_message(message)
        
        # Store response in file system (this would be replaced with a database in production)
        boxes_file_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'dynamic-ui', 'public', 'boxes.json')
        
        try:
            # Ensure directory exists
            os.makedirs(os.path.dirname(boxes_file_path), exist_ok=True)
            
            with open(boxes_file_path, 'w') as f:
                json.dump(response, f)
                
            logging.info(f"Saved response to {boxes_file_path}")
        except Exception as e:
            logging.error(f"Failed to save response to file: {str(e)}")
        
        return jsonify(response)
        
    except Exception as e:
        logging.error(f"Error processing message: {str(e)}")
        return jsonify({"error": str(e), "products": []}), 500

@message_routes.route('/api/boxes', methods=['GET'])
@jwt_required(optional=True)  # Optional to allow non-authenticated users
def get_boxes():
    try:
        # Get the current user (if authenticated)
        user_id = get_jwt_identity()
        
        # In a real implementation, we would fetch user-specific data from a database
        # For now, we'll just read from the file
        
        boxes_file_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'dynamic-ui', 'public', 'boxes.json')
        
        try:
            if os.path.exists(boxes_file_path):
                with open(boxes_file_path, 'r') as f:
                    data = json.load(f)
                return jsonify(data)
            else:
                logging.warning(f"Boxes file not found at {boxes_file_path}")
                return jsonify({"products": []})
        except Exception as e:
            logging.error(f"Failed to read boxes file: {str(e)}")
            return jsonify({"error": str(e), "products": []}), 500
            
    except Exception as e:
        logging.error(f"Error getting boxes: {str(e)}")
        return jsonify({"error": str(e), "products": []}), 500