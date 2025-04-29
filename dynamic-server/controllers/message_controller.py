import json
import logging
import traceback
from flask import jsonify, request, Blueprint
from services.github_llm_service import GitHubLLMService
from services.product_comparison_service import ProductComparisonService
from config import Config

message_routes = Blueprint('message_routes', __name__)
comparison_service = None

def init_routes(service: ProductComparisonService):
    global comparison_service
    comparison_service = service

# Original routes (keep for backward compatibility)
@message_routes.route('/send-message', methods=['POST'])
def handle_message():
    return process_message_request()

@message_routes.route('/boxes', methods=['GET'])
def get_boxes():
    return get_box_data()

# New API routes with /api prefix
@message_routes.route('/api/send-message', methods=['POST'])
def api_handle_message():
    return process_message_request()

@message_routes.route('/api/boxes', methods=['GET'])
def api_get_boxes():
    return get_box_data()

# Core function to process message requests
def process_message_request():
    try:
        # Log request headers to check for potential issues
        request_headers = {k: v for k, v in request.headers.items() 
                          if k.lower() not in ['authorization', 'cookie']}  # Exclude sensitive headers
        logging.info(f"Request headers: {json.dumps(request_headers)}")
        
        data = request.get_json()
        if not data or 'message' not in data:
            logging.warning("No message provided in request")
            return jsonify({"error": "No message provided"}), 400

        message = data['message']
        logging.info(f"Received message: {message}")

        # Check if comparison service is properly initialized
        if comparison_service is None:
            logging.error("Comparison service not initialized")
            return jsonify({
                "error": "Service not initialized",
                "products": []
            }), 500

        # Process the message through our LangGraph workflow
        response = comparison_service.process_message(message)
        
        # Log the response structure (without sensitive data)
        log_response = {k: v for k, v in response.items() if k != 'products'}
        if 'products' in response:
            log_response['product_count'] = len(response['products'])
        logging.info(f"Response metadata: {json.dumps(log_response)}")
        
        if not response.get("success", False):
            error_msg = response.get("error", "Unknown error occurred")
            logging.error(f"Error in response: {error_msg}")
            
            # Check if there are any additional error details
            error_details = response.get("details", {})
            if error_details:
                logging.error(f"Error details: {json.dumps(error_details)}")
            
            return jsonify({
                "error": error_msg,
                "products": []
            }), 500

        return jsonify({
            "products": response.get("products", []),
            "query": response.get("query", message),
            "analysis_complete": response.get("analysis_complete", False)
        })

    except Exception as e:
        error_traceback = traceback.format_exc()
        logging.error(f"Error processing message: {str(e)}")
        logging.error(f"Traceback: {error_traceback}")
        return jsonify({"error": str(e), "products": []}), 500

# Core function to get box data
def get_box_data():
    try:
        if comparison_service is None:
            logging.error("Comparison service not initialized for boxes request")
            return jsonify({"error": "Service not initialized", "products": []}), 500
        
        # Return the current state of products
        products = comparison_service.get_current_products() if hasattr(comparison_service, 'get_current_products') else []
        logging.info(f"Returning {len(products)} products from get_boxes endpoint")
        return jsonify({
            "products": products,
            "analysis_complete": True
        })
    except Exception as e:
        error_traceback = traceback.format_exc()
        logging.error(f"Error getting boxes: {str(e)}")
        logging.error(f"Traceback: {error_traceback}")
        return jsonify({"error": str(e), "products": []}), 500

class MessageController:
    def __init__(self):
        self.comparison_service = None

    def set_comparison_service(self, service: ProductComparisonService):
        self.comparison_service = service