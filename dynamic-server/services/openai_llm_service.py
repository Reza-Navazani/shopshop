import json
import logging
import os
import time
import traceback
import requests

class GitHubLLMService:
    def __init__(self, endpoint, token, model):
        if not isinstance(token, str):
            logging.error("Token must be a string")
            raise TypeError("key must be a string.")
            
        self.endpoint = endpoint
        self.token = token
        self.model = model
        logging.info(f"Initializing LLM service with endpoint: {endpoint}, model: {model}")
        
        # For GitHub AI Inference endpoint, we'll use direct HTTP requests
        # No need to initialize a client here
        logging.info("GitHub LLM client initialized via direct API access")

    def fetch_response(self, prompt):
        try:
            if not prompt or not isinstance(prompt, str):
                logging.error("Invalid prompt provided")
                return {"error": "Invalid prompt", "products": []}

            logging.info(f"Sending request to GitHub LLM service with prompt length: {len(prompt)}")
            logging.debug(f"Using endpoint: {self.endpoint}, model: {self.model}")
            
            # Add timestamp for timing the request
            start_time = time.time()
            
            try:
                # System message defining the assistant's role
                system_message = """You are a product comparison assistant. Your job is to:
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
}"""

                # For GitHub AI Inference API
                headers = {
                    "Authorization": f"Bearer {self.token}",
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                }
                
                payload = {
                    "model": self.model,
                    "messages": [
                        {"role": "system", "content": system_message},
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": 0.7,
                    "top_p": 0.9
                }
                
                response = requests.post(
                    self.endpoint,
                    headers=headers,
                    json=payload,
                    timeout=30  # 30 second timeout
                )
                
                # Check for HTTP errors
                response.raise_for_status()
                
                # Parse the JSON response
                response_data = response.json()
                
                elapsed_time = time.time() - start_time
                logging.info(f"Received response from LLM service in {elapsed_time:.2f} seconds")
                
                # Extract content from the response based on GitHub AI format
                if "choices" not in response_data or not response_data["choices"]:
                    logging.error("Empty choices in response")
                    return {"error": "Empty response from service", "products": []}
                
                content = response_data["choices"][0]["message"]["content"].strip()
                
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
                    
                    # Include metadata from the original response, or provide default
                    metadata = parsed_content.get("metadata", {"highlight_unhealthy": False})
                    
                    # Only return 'error' key if there is a real error
                    logging.info("Successfully parsed LLM response")
                    return {
                        "products": parsed_content["products"],
                        "metadata": metadata
                    }
                    
                except json.JSONDecodeError as e:
                    logging.error(f"Failed to decode JSON response: {str(e)}\nContent: {content}")
                    return {"error": "Invalid response format", "products": []}
                
            except requests.exceptions.RequestException as e:
                elapsed_time = time.time() - start_time
                error_details = {
                    "message": str(e),
                    "elapsed_time": f"{elapsed_time:.2f} seconds"
                }
                logging.error(f"GitHub LLM API Request Error: {json.dumps(error_details)}")
                return {"error": f"GitHub LLM API error: {str(e)}", "products": []}
            
        except Exception as e:
            logging.error(f"Error fetching LLM response: {str(e)}")
            logging.error(f"Traceback: {traceback.format_exc()}")
            return {"error": f"LLM service error: {str(e)}", "products": []}