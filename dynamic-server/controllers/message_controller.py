import json
import logging
import traceback
import os
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

# Add a diagnostic endpoint to test LLM connectivity
@message_routes.route('/api/llm-health', methods=['GET'])
def llm_health_check():
    try:
        # Get current environment variables
        env_vars = {
            "GITHUB_LLM_ENDPOINT": os.getenv('GITHUB_LLM_ENDPOINT', 'Not set'),
            "GITHUB_LLM_MODEL": os.getenv('GITHUB_LLM_MODEL', 'Not set'),
            "GITHUB_LLM_TOKEN_SET": "Yes" if os.getenv('GITHUB_LLM_TOKEN') else "No"
        }
        
        # Test connectivity with a minimal LLM call
        if comparison_service and comparison_service.llm_service:
            # Simple test prompt
            test_result = comparison_service.llm_service.fetch_response("test connectivity with a simple response")
            llm_status = "working" if "products" in test_result and "error" not in test_result else "failing"
            error_details = test_result.get("error", None) if "error" in test_result else None
        else:
            llm_status = "service not initialized"
            error_details = "LLM service not properly initialized"
        
        return jsonify({
            "status": "healthy" if llm_status == "working" else "unhealthy",
            "llm_status": llm_status,
            "environment": env_vars,
            "error": error_details
        }), 200 if llm_status == "working" else 500
    except Exception as e:
        error_traceback = traceback.format_exc()
        logging.error(f"Error in LLM health check: {str(e)}")
        logging.error(f"Traceback: {error_traceback}")
        return jsonify({
            "status": "unhealthy",
            "llm_status": "error",
            "error": str(e),
            "traceback": error_traceback
        }), 500

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