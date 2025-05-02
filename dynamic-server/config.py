import os
import logging
import secrets
from datetime import timedelta
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create a fixed JWT secret key file if it doesn't exist
JWT_SECRET_FILE = os.path.join(os.path.dirname(__file__), 'jwt_secret.key')
if not os.path.exists(JWT_SECRET_FILE):
    # Generate a new strong random secret key
    with open(JWT_SECRET_FILE, 'w') as f:
        f.write(secrets.token_hex(32))
    logger.info(f"Generated new JWT secret key and stored in {JWT_SECRET_FILE}")

# Read the secret key from file
try:
    with open(JWT_SECRET_FILE, 'r') as f:
        jwt_secret = f.read().strip()
except Exception as e:
    logger.error(f"Error reading JWT secret key file: {str(e)}")
    # Fallback to random secret (will invalidate existing tokens)
    jwt_secret = secrets.token_hex(32)
    logger.warning("Using fallback JWT secret key (all existing tokens will be invalidated)")

class Config:
    # GitHub LLM Service Config
    GITHUB_LLM_ENDPOINT = os.environ.get('GITHUB_LLM_ENDPOINT', 'https://api.github.com/copilot/completions')
    GITHUB_LLM_TOKEN = os.environ.get('GITHUB_LLM_TOKEN', '')
    GITHUB_LLM_MODEL = os.environ.get('GITHUB_LLM_MODEL', 'github-copilot')

    # JWT Config
    JWT_SECRET_KEY = jwt_secret
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=1)
    JWT_ERROR_MESSAGE_KEY = 'error'
    JWT_ALGORITHM = 'HS256'  # Default algorithm for Flask-JWT-Extended

    # Get token with safer validation that won't crash the app on startup
    if not GITHUB_LLM_TOKEN:
        logger.warning("GITHUB_LLM_TOKEN environment variable not set. LLM functionality will be limited.")
        # Use a placeholder value that will cause API calls to fail gracefully
        # rather than crashing the entire application on startup
        GITHUB_LLM_TOKEN = "missing-token"
        
    OUTPUT_FILE_PATH = os.path.join(os.path.dirname(__file__), '..', 'dynamic-ui', 'public', 'boxes.json')