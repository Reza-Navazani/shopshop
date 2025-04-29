import os
import logging
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class Config:
    GITHUB_LLM_ENDPOINT = os.getenv('GITHUB_LLM_ENDPOINT', 'https://models.github.ai/inference')
    GITHUB_LLM_MODEL = os.getenv('GITHUB_LLM_MODEL', 'openai/gpt-4.1')
    
    # Get token with safer validation that won't crash the app on startup
    GITHUB_LLM_TOKEN = os.getenv('GITHUB_LLM_TOKEN')
    if not GITHUB_LLM_TOKEN:
        logger.warning("GITHUB_LLM_TOKEN environment variable not set. LLM functionality will be limited.")
        # Use a placeholder value that will cause API calls to fail gracefully
        # rather than crashing the entire application on startup
        GITHUB_LLM_TOKEN = "missing-token"
        
    OUTPUT_FILE_PATH = os.path.join(os.path.dirname(__file__), '..', 'dynamic-ui', 'public', 'boxes.json')