from azure.ai.inference import ChatCompletionsClient
from azure.ai.inference.models import SystemMessage, UserMessage
from azure.core.credentials import AzureKeyCredential
import json
import logging
import os

class GitHubLLMService:
    def __init__(self, endpoint, token, model):
        if not isinstance(token, str):
            logging.error("Token must be a string")
            raise TypeError("key must be a string.")
            
        self.endpoint = endpoint
        self.token = token
        self.model = model
        logging.info(f"Initializing LLM service with endpoint: {endpoint}, model: {model}")
        try:
            self.client = ChatCompletionsClient(
                endpoint=endpoint,
                credential=AzureKeyCredential(token),
            )
            logging.info("LLM client initialized successfully")
        except Exception as e:
            logging.error(f"Failed to initialize LLM client: {str(e)}")
            raise

    def fetch_response(self, prompt):
        try:
            if not prompt or not isinstance(prompt, str):
                logging.error("Invalid prompt provided")
                return {"error": "Invalid prompt", "products": []}

            logging.info(f"Sending request to LLM service with prompt length: {len(prompt)}")
            logging.debug(f"Using endpoint: {self.endpoint}, model: {self.model}")

            response = self.client.complete(
                messages=[
                    SystemMessage("""You are a product comparison assistant. Your job is to:
1. Parse user queries about products and return comparative product information
3. Include realistic prices in the local currency
4. Format responses in strict JSON only

Response format must be:
{
    "products": [
        {
            "title": "Product 1 name and brand",
            "description": "Brief product description",
            "price": "Price in local currency",
            "store_name": "Store name",
            "ingredient": "Main ingredients",
            "made_in": "Country of origin"
        },
        {
            "title": "Product 2 name and brand",
            "description": "Brief product description",
            "price": "Price in local currency",
            "store_name": "Store name",
            "ingredient": "Main ingredients",
            "made_in": "Country of origin"
        }
    ]
}

For grocery queries:
- Include store-specific details
- Use realistic local prices
- Compare similar products from different stores
- Include ingredient information when relevant

Example query: "bread in canada"
Example response: {
    "products": [
        {
            "title": "Dempster's Whole Grain Bread",
            "description": "Fresh whole grain bread, 675g loaf",
            "price": "CAD 4.99",
            "store_name": "Loblaws",
            "ingredient": "Whole grain wheat flour, water, yeast, salt",
            "made_in": "Canada"
        },
        {
            "title": "Wonder Bread 100% Whole Wheat",
            "description": "Soft whole wheat bread, 675g loaf",
            "price": "CAD 4.79",
            "store_name": "Metro",
            "ingredient": "Whole wheat flour, water, yeast, salt",
            "made_in": "Canada"
        }
    ]
}"""),
                    UserMessage(prompt),
                ],
                temperature=0.7,
                top_p=0.9,
                model=self.model
            )
            
            logging.info("Received response from LLM service")
            
            if not response or not response.choices:
                logging.error("Empty response from LLM service")
                return {"error": "Empty response from service", "products": []}

            content = response.choices[0].message.content.strip()
            if not content:
                logging.error("Empty content in LLM response")
                return {"error": "Empty content in response", "products": []}

            try:
                parsed_content = json.loads(content)
                if not isinstance(parsed_content, dict) or "products" not in parsed_content:
                    logging.error(f"Invalid JSON structure in response: {content}")
                    return {"error": "Invalid response structure", "products": []}
                
                # Validate products array
                if not isinstance(parsed_content["products"], list):
                    logging.error("Products field is not an array")
                    return {"error": "Invalid products structure", "products": []}
                
                # Only return 'error' key if there is a real error
                logging.info("Successfully parsed LLM response")
                return {"products": parsed_content["products"]}
                
            except json.JSONDecodeError as e:
                logging.error(f"Failed to decode JSON response: {str(e)}\nContent: {content}")
                return {"error": "Invalid response format", "products": []}

        except Exception as e:
            logging.error(f"Error fetching LLM response: {str(e)}", exc_info=True)
            return {"error": f"LLM service error: {str(e)}", "products": []}