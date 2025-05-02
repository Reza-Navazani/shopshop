# main.py
# Entry point for the application
import logging
import os
import datetime
from flask import Flask, request, jsonify, send_from_directory, make_response
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager
from controllers.message_controller import MessageController, message_routes, init_routes
from controllers.product_controller import user_product_routes, init_product_routes
from controllers.preference_controller import preference_routes, init_preference_routes
from services.github_llm_service import GitHubLLMService
from services.product_comparison_service import ProductComparisonService
from azure.core.exceptions import HttpResponseError
from config import Config
from werkzeug.middleware.proxy_fix import ProxyFix

# Configure logging with more detailed format
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(name)s - %(message)s'
)

app = Flask(__name__, static_folder=None)  # We'll define static folders manually

# Custom middleware to handle OPTIONS requests directly
class OptionsCorsMiddleware:
    def __init__(self, app):
        self.app = app

    def __call__(self, environ, start_response):
        # If this is an OPTIONS request, respond immediately with CORS headers
        if environ.get('REQUEST_METHOD') == 'OPTIONS':
            headers = [
                ('Content-Type', 'text/plain'),
                ('Access-Control-Allow-Origin', environ.get('HTTP_ORIGIN', '*')),
                ('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS'),
                ('Access-Control-Allow-Headers', 'Content-Type, Authorization'),
                ('Access-Control-Allow-Credentials', 'true'),
                ('Access-Control-Max-Age', '3600'),  # Cache preflight for 1 hour
            ]
            start_response('200 OK', headers)
            return [b'']  # Empty response body
        
        # Not an OPTIONS request, continue normal processing
        return self.app(environ, start_response)

# Apply our custom middleware BEFORE any Flask middleware
app.wsgi_app = OptionsCorsMiddleware(app.wsgi_app)
# Also apply ProxyFix for handling potential proxies
app.wsgi_app = ProxyFix(app.wsgi_app)

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///shop_assist.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Disable URL trailing slash redirect that causes 308 redirect
app.url_map.strict_slashes = False

# JWT configuration - using centralized config
app.config['JWT_SECRET_KEY'] = Config.JWT_SECRET_KEY
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = Config.JWT_ACCESS_TOKEN_EXPIRES
app.config['JWT_ERROR_MESSAGE_KEY'] = Config.JWT_ERROR_MESSAGE_KEY
app.config['JWT_ALGORITHM'] = Config.JWT_ALGORITHM
app.config['PROPAGATE_EXCEPTIONS'] = True  # Important for JWT error handling
app.config['JWT_TOKEN_LOCATION'] = ['headers']  # Only look for token in headers
app.config['JWT_HEADER_NAME'] = 'Authorization'  # Header name
app.config['JWT_HEADER_TYPE'] = 'Bearer'  # Header type

# Initialize extensions
db = SQLAlchemy(app)
bcrypt = Bcrypt(app)
jwt = JWTManager(app)

# Configure CORS - But disable automatic OPTIONS handling to avoid duplicate headers
CORS(app, 
     resources={r"/*": {"origins": ["http://localhost:5173", "https://dynamic-ui.azurewebsites.net"]}},
     supports_credentials=True,
     max_age=86400,  # Cache preflight response for 24 hours (in seconds)
     automatic_options=False)  # Disable automatic OPTIONS handling

# Modify after_request to REPLACE headers instead of ADD to avoid duplicates
@app.after_request
def after_request(response):
    # Only set headers if they're not already set by our middleware
    if response.status_code != 308:  # Don't add CORS headers to redirects
        # Replace instead of add to avoid duplicates
        response.headers.set('Access-Control-Allow-Origin', request.headers.get('Origin', '*'))
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.set('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
        response.headers.set('Access-Control-Allow-Credentials', 'true')
    return response

# JWT error handlers
@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    return jsonify({
        'status': 401,
        'error': 'The token has expired',
        'message': 'Please log in again'
    }), 401

@jwt.invalid_token_loader
def invalid_token_callback(error):
    return jsonify({
        'status': 422,
        'error': 'Invalid token',
        'message': 'Signature verification failed'
    }), 422

@jwt.unauthorized_loader
def missing_token_callback(error):
    return jsonify({
        'status': 401,
        'error': 'Authorization required',
        'message': 'Missing or invalid JWT token'
    }), 401

@jwt.needs_fresh_token_loader
def token_not_fresh_callback(jwt_header, jwt_payload):
    return jsonify({
        'status': 401,
        'error': 'Fresh token required',
        'message': 'Please log in again'
    }), 401

@jwt.revoked_token_loader
def revoked_token_callback(jwt_header, jwt_payload):
    return jsonify({
        'status': 401,
        'error': 'Token has been revoked',
        'message': 'Please log in again'
    }), 401

# Initialize the User model
from models.user_model import User
user_instance = User(db, bcrypt)
UserModel = user_instance.get_model()

# Initialize the UserProduct model
from models.user_product_model import UserProduct
user_product_instance = UserProduct(db)
UserProductModel = user_product_instance.get_model()

# Initialize the UserPreference model
from models.user_preference_model import UserPreference
user_preference_instance = UserPreference(db)
UserPreferenceModel = user_preference_instance.get_model()

# Import auth routes - after UserModel is defined
from controllers.auth_controller import create_auth_blueprint
auth_bp = create_auth_blueprint(UserModel, db)
app.register_blueprint(auth_bp, url_prefix='/api/auth')

# Initialize product routes
init_product_routes(UserModel, UserProductModel)
app.register_blueprint(user_product_routes, url_prefix='/api/products')

# Initialize preference routes
init_preference_routes(UserModel, UserPreferenceModel, db)
app.register_blueprint(preference_routes, url_prefix='/api/preferences')

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

# Handle OPTIONS requests explicitly for CORS preflight
@app.route('/api/<path:path>', methods=['OPTIONS'])
def handle_options(path):
    response = make_response()
    # Add required CORS headers
    response.headers.add('Access-Control-Allow-Origin', request.headers.get('Origin', '*'))
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    response.headers.add('Access-Control-Max-Age', '3600')  # Cache preflight response for 1 hour
    return response

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
    # Create tables
    with app.app_context():
        try:
            db.create_all()
            logging.info("Database tables created successfully")
        except Exception as e:
            logging.error(f"Error creating database tables: {str(e)}")
            
    # Get port from environment variable or use default
    port = int(os.environ.get('PORT', 5000))
    # In production, host on 0.0.0.0 to accept all incoming connections
    app.run(host='0.0.0.0', port=port)