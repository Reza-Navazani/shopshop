from azure.ai.inference import ChatCompletionsClient
from azure.ai.inference.models import SystemMessage, UserMessage
from azure.core.credentials import AzureKeyCredential
from azure.core.exceptions import HttpResponseError, ServiceRequestError, ServiceResponseError
import json
import logging
import os
import time
import traceback

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
            
            # Add timestamp for timing the request
            start_time = time.time()
            
            try:
                response = self.client.complete(
                    messages=[
                        SystemMessage("""You are a product comparison assistant. Your job is to:
1. Parse user queries about products and return comparative product information
2. Include realistic prices in the local currency
3. Return ingredients as plain text without any HTML formatting
4. Format responses in strict JSON only

Response format must be:
{
    "products": [
        {
            "title": "Product 1 name and brand",
            "description": "Brief product description",
            "price": "Price in local currency",
            "store_name": "Store name",
            "ingredients": {
                "list": ["ingredient1", "ingredient2"],  // Plain text ingredients only, no HTML
                "unhealthy": ["ingredient1"]  // Only included when user asks about unhealthy ingredients
            },
            "made_in": "Country of origin"
        }
    ],
    "metadata": {
        "highlight_unhealthy": false  // Set to true only when user asks about unhealthy ingredients
    }
}

For grocery queries:
- Include store-specific details
- Use realistic local prices
- Compare similar products from different stores
- Return all ingredients as plain text without HTML formatting
- Mark unhealthy ingredients only when specifically asked
- Common unhealthy ingredients include: high fructose corn syrup, artificial sweeteners, trans fats, MSG, artificial colors

Example query: "bread in canada with unhealthy ingredients marked"
Example response: {
    "products": [
        {
            "title": "Dempster's Whole Grain Bread",
            "description": "Fresh whole grain bread, 675g loaf",
            "price": "CAD 4.99",
            "store_name": "Loblaws",
            "ingredients": {
                "list": ["whole grain wheat flour", "water", "yeast", "salt", "sugar", "vegetable oil"],
                "unhealthy": ["sugar"]
            },
            "made_in": "Canada"
        }
    ],
    "metadata": {
        "highlight_unhealthy": true
    }
}"""),
                        UserMessage(prompt),
                    ],
                    temperature=0.7,
                    top_p=0.9,
                    model=self.model
                )
                
                elapsed_time = time.time() - start_time
                logging.info(f"Received response from LLM service in {elapsed_time:.2f} seconds")
                
            except HttpResponseError as e:
                elapsed_time = time.time() - start_time
                error_details = {
                    "status_code": e.status_code if hasattr(e, 'status_code') else "unknown",
                    "error_code": e.error.code if hasattr(e, 'error') and hasattr(e.error, 'code') else "unknown",
                    "message": str(e),
                    "elapsed_time": f"{elapsed_time:.2f} seconds"
                }
                logging.error(f"Azure HTTP Response Error: {json.dumps(error_details)}")
                return {"error": f"Azure OpenAI API error: {str(e)}", "products": [], "details": error_details}
                
            except ServiceRequestError as e:
                elapsed_time = time.time() - start_time
                logging.error(f"Azure Service Request Error after {elapsed_time:.2f} seconds: {str(e)}")
                return {"error": f"Failed to connect to Azure OpenAI service: {str(e)}", "products": []}
                
            except ServiceResponseError as e:
                elapsed_time = time.time() - start_time
                logging.error(f"Azure Service Response Error after {elapsed_time:.2f} seconds: {str(e)}")
                return {"error": f"Azure OpenAI service returned an error: {str(e)}", "products": []}
            
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
            logging.error(f"Error fetching LLM response: {str(e)}")
            logging.error(f"Traceback: {traceback.format_exc()}")
            return {"error": f"LLM service error: {str(e)}", "products": []}