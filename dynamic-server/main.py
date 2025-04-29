# main.py
# Entry point for the application
import logging
import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from controllers.message_controller import MessageController, message_routes, init_routes
from services.github_llm_service import GitHubLLMService
from services.product_comparison_service import ProductComparisonService
from azure.core.exceptions import HttpResponseError
from config import Config

# Configure logging with more detailed format
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(name)s - %(message)s'
)

app = Flask(__name__)
CORS(app)  # Simplified CORS to allow all origins in production

# Add root route for diagnostics
@app.route('/')
def root():
    return jsonify({
        "status": "online",
        "version": "1.0",
        "endpoints": ["/health", "/send-message", "/boxes"]
    })

# Initialize services and controller
try:
    llm_service = GitHubLLMService(
        endpoint=Config.GITHUB_LLM_ENDPOINT,
        token=Config.GITHUB_LLM_TOKEN,
        model=Config.GITHUB_LLM_MODEL
    )
    comparison_service = ProductComparisonService(llm_service)
    message_controller = MessageController()
    message_controller.set_comparison_service(comparison_service)

    # Register the message_routes blueprint
    init_routes(comparison_service)
    app.register_blueprint(message_routes)
except Exception as e:
    logging.error(f"Failed to initialize services: {str(e)}")
    raise

@app.errorhandler(Exception)
def handle_exception(e):
    # Log the full exception with traceback
    logging.exception("Unhandled exception occurred:")
    if isinstance(e, HttpResponseError):
        # Handle Azure SDK specific errors
        return jsonify({
            "error": f"LLM Service error: {str(e)}",
            "status_code": e.status_code if hasattr(e, 'status_code') else 500
        }), 500
    return jsonify({"error": str(e)}), 500

# Add a health check endpoint
@app.route('/health')
def health_check():
    return jsonify({"status": "healthy"}), 200

if __name__ == '__main__':
    # Get port from environment variable or use default
    port = int(os.environ.get('PORT', 8000))
    # In production, host on 0.0.0.0 to accept all incoming connections
    app.run(host='0.0.0.0', port=port)