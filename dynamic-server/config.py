import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Config:
    GITHUB_LLM_ENDPOINT = os.getenv('GITHUB_LLM_ENDPOINT', 'https://models.github.ai/inference')
    GITHUB_LLM_MODEL = os.getenv('GITHUB_LLM_MODEL', 'openai/gpt-4.1')
    
    # Get token and validate it's provided
    GITHUB_LLM_TOKEN = os.getenv('GITHUB_LLM_TOKEN')
    if not GITHUB_LLM_TOKEN:
        raise ValueError("GITHUB_LLM_TOKEN environment variable must be set in .env file")
        
    OUTPUT_FILE_PATH = os.path.join(os.path.dirname(__file__), '..', 'dynamic-ui', 'public', 'boxes.json')