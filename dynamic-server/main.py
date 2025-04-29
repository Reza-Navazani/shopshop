# main.py
# Entry point for the application
import logging
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
CORS(app, resources={r"/*": {"origins": "*"}})

# Initialize services and controller
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

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000)