import json
import logging
from flask import jsonify, request, Blueprint
from services.github_llm_service import GitHubLLMService
from services.product_comparison_service import ProductComparisonService
from config import Config
import traceback

message_routes = Blueprint('message_routes', __name__)
comparison_service = None

def init_routes(service: ProductComparisonService):
    global comparison_service
    comparison_service = service

@message_routes.route('/send-message', methods=['POST'])
def handle_message():
    try:
        data = request.get_json()
        if not data or 'message' not in data:
            return jsonify({"error": "No message provided"}), 400

        message = data['message']
        logging.info(f"Received message: {message}")

        # Process the message through our LangGraph workflow
        response = comparison_service.process_message(message)
        
        if not response.get("success", False):
            return jsonify({
                "error": response.get("error", "Unknown error occurred"),
                "products": []
            }), 500

        return jsonify({
            "products": response.get("products", []),
            "query": response.get("query", message),
            "analysis_complete": response.get("analysis_complete", False)
        })

    except Exception as e:
        logging.exception("Error processing message:")
        return jsonify({"error": str(e), "products": []}), 500

@message_routes.route('/boxes', methods=['GET'])
def get_boxes():
    try:
        if comparison_service is None:
            return jsonify({"error": "Service not initialized", "products": []}), 500
        
        # Return the current state of products
        return jsonify({
            "products": comparison_service.get_current_products() if hasattr(comparison_service, 'get_current_products') else [],
            "analysis_complete": True
        })
    except Exception as e:
        logging.error(f"Error getting boxes: {str(e)}")
        return jsonify({"error": str(e), "products": []}), 500

class MessageController:
    def __init__(self):
        self.comparison_service = None

    def set_comparison_service(self, service: ProductComparisonService):
        self.comparison_service = service