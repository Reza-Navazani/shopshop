# main.py
# Entry point for the application
import logging
import os
from flask import Flask, request, jsonify, send_from_directory
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

app = Flask(__name__, static_folder=None)  # We'll define static folders manually
CORS(app)  # Simplified CORS to allow all origins in production

# Determine the path to the React build directory
# Look in several possible locations to handle different deployment scenarios
possible_static_dirs = [
    os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static'),  # ./static
    os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'dynamic-ui', 'dist'),  # ../dynamic-ui/dist
    '/home/site/wwwroot/static',  # Azure App Service standard path
]

REACT_BUILD_DIR = None
for dir_path in possible_static_dirs:
    if os.path.exists(dir_path):
        REACT_BUILD_DIR = dir_path
        break

if REACT_BUILD_DIR:
    logging.info(f"Found React build directory: {REACT_BUILD_DIR}")
else:
    logging.warning("React build directory not found in any of the expected locations!")
    # Fallback to a subdirectory in the current path
    REACT_BUILD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static')
    os.makedirs(REACT_BUILD_DIR, exist_ok=True)
    logging.info(f"Created fallback static directory: {REACT_BUILD_DIR}")

# Add root route for single page application
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_react(path):
    # Special case for API routes
    if path.startswith('api/'):
        # This will 404, but that's fine - our API routes handle this
        return "API endpoint", 404
    
    # Special case for direct API access without the /api prefix
    if path in ['send-message', 'boxes', 'health']:
        # This will 404, but that's fine - our API routes handle this
        return "API endpoint", 404
        
    # Check if path is a file in the static directory
    if os.path.exists(os.path.join(REACT_BUILD_DIR, path)):
        return send_from_directory(REACT_BUILD_DIR, path)
        
    # Check if the path contains a dot (like .js, .css)
    # If so, it's likely a static file that doesn't exist
    if '.' in path:
        logging.warning(f"Static file not found: {path}")
        return f"File not found: {path}", 404
        
    # Otherwise serve index.html (for SPA routing)
    if os.path.exists(os.path.join(REACT_BUILD_DIR, 'index.html')):
        return send_from_directory(REACT_BUILD_DIR, 'index.html')
    else:
        logging.error(f"index.html not found in {REACT_BUILD_DIR}")
        return "Frontend not built or not found", 500

# API routes with /api prefix for separation
@app.route('/api/health')
def api_health_check():
    return jsonify({"status": "healthy"}), 200
    
# Add a health check endpoint (legacy, keep for backward compatibility)
@app.route('/health')
def health_check():
    return jsonify({"status": "healthy"}), 200

# Initialize services and controller - with better error handling
llm_service = None
comparison_service = None
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
    logging.info("Successfully initialized all services and routes")
except Exception as e:
    logging.error(f"Failed to initialize some services: {str(e)}")
    logging.warning("Application will start with limited functionality")
    # Don't re-raise the exception, let the app continue to start

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
    # Get port from environment variable or use default
    port = int(os.environ.get('PORT', 5000))
    # In production, host on 0.0.0.0 to accept all incoming connections
    app.run(host='0.0.0.0', port=port)