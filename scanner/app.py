import cv2
import requests
import numpy as np
from ultralytics import YOLO
from pyzbar.pyzbar import decode
from PIL import Image
import time
import os
import io
import logging
import traceback
from flask import Flask, request, jsonify
from flask_cors import CORS

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = Flask(__name__)
# Configure CORS to allow requests from your Azure Static Web App
CORS(app, 
     origins=["https://blue-desert-00651801e.6.azurestaticapps.net", 
              "http://localhost:3000", 
              "http://localhost:5173",
              "https://scanner-bmfhhwf0a5drhrb7.canadacentral-01.azurewebsites.net"],
     methods=["GET", "POST", "OPTIONS"],
     allow_headers=["Content-Type", "Authorization", "Accept", "Origin"],
     supports_credentials=False,
     max_age=3600)

# Load YOLOv8 model
model_path = os.path.join(os.path.dirname(__file__), 'best.pt')
try:
    logger.info(f"Loading YOLO model from {model_path}")
    model = YOLO(model_path)
    logger.info("YOLO model loaded successfully")
except Exception as e:
    logger.error(f"Error loading YOLO model: {e}")
    model = None

def preprocess_image(image, method='default'):
    start_time = time.time()
    """Detects a barcode using YOLOv8 and extracts numbers using Pyzbar."""
    # Check if model was loaded successfully
    if model is None:
        logger.error("YOLO model not loaded properly")
        return {
            "error": "Barcode detection model not loaded properly",
            "barcode": ""
        }
        
    # Convert image to OpenCV format
    image_cv = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)

    # Run YOLOv8 for barcode detection
    results = model(image_cv)
    detected_barcode = False

    for result in results:
        for box in result.boxes:
            x1, y1, x2, y2 = map(int, box.xyxy[0])  # Get bounding box

            # Crop the barcode region
            barcode_region = image_cv[y1:y2, x1:x2]
            
            # Save the cropped region for debugging (optional)
            debug_path = os.path.join(os.path.dirname(__file__), 'debug_crop.jpg')
            cv2.imwrite(debug_path, barcode_region)
            logger.debug(f"Saved cropped barcode region to {debug_path}")

            # Decode barcode using Pyzbar
            barcodes = decode(barcode_region)
            for barcode in barcodes:
                detected_barcode = True
                barcode_data = barcode.data.decode("utf-8")
                if barcode_data:
                  barcode_number = barcode_data  # First detected text
                  product = lookup_product(barcode_number)  # Call the lookup function
                  response_time = time.time() - start_time
                  response_text=f"Response Time: {response_time:.4f} seconds"
                  logger.debug(response_text)
                  return product
    
    # If YOLO model didn't detect any barcode region, try direct barcode detection on the full image
    if not detected_barcode:
        logger.debug("YOLO didn't detect any barcode region, trying direct barcode detection")
        
        # Try different preprocessing techniques
        # 1. Original image
        barcodes = decode(image_cv)
        
        # 2. If no barcodes found, try grayscale conversion
        if not barcodes:
            gray = cv2.cvtColor(image_cv, cv2.COLOR_BGR2GRAY)
            barcodes = decode(gray)
            
        # 3. If still no barcodes, try thresholding
        if not barcodes:
            _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
            barcodes = decode(thresh)
        
        for barcode in barcodes:
            barcode_data = barcode.data.decode("utf-8")
            if barcode_data:
                barcode_number = barcode_data
                product = lookup_product(barcode_number)
                response_time = time.time() - start_time
                logger.debug(f"Direct detection successful. Response Time: {response_time:.4f} seconds")
                return product
    
    # If we get here, no barcode was detected with any method
    logger.warning("No barcode detected in the image")
    response_time = time.time() - start_time
    return {
        "error": "No barcode detected in the image. Please ensure barcode is clearly visible and well-lit.",
        "barcode": ""
    }

def lookup_product(barcode_number):
    """Fetches product details using a barcode number."""
    try:
        BARCODE_API_URL = "https://world.openfoodfacts.org/api/v0/product/"
        link = f"{BARCODE_API_URL}{barcode_number}.json"
        
        response = requests.get(link)
        response.raise_for_status()

        product_data = response.json()
        
        # Check if product exists
        if product_data.get("status") != 1 or "product" not in product_data:
            return {
                "name": "Product Not Found",
                "description": "No data available for this barcode",
                "ingredients": "N/A",
                "barcode": barcode_number
            }
        
        product = product_data["product"]
        
        # Get product name - prefer English name if available
        product_name = (
            product.get("product_name_en") or 
            product.get("product_name") or 
            "Unknown Product"
        )
        
        # Extract ingredients from the ingredients array
        ingredients_list = []
        unhealthy_ingredients = []
        
        # Define unhealthy ingredients to flag
        unhealthy_terms = [
            "palm oil", "high fructose corn syrup", "corn syrup", "artificial", 
            "hydrogenated", "msg", "monosodium glutamate", "food coloring",
            "sodium nitrite", "sodium benzoate", "bha", "bht", "partially hydrogenated"
        ]
        
        # First, try to get English ingredients
        if "ingredients_text_en" in product and product["ingredients_text_en"]:
            logger.debug("Found English ingredients text")
            ingredients_text = product["ingredients_text_en"]
            if ingredients_text:
                ingredients_list = [item.strip() for item in ingredients_text.split(",") if item.strip()]
                
                # Check for unhealthy ingredients in the text
                for ingredient in ingredients_list:
                    if any(bad in ingredient.lower() for bad in unhealthy_terms):
                        unhealthy_ingredients.append(ingredient)
                        
        # If no English ingredients, try structured ingredients data
        elif "ingredients" in product and isinstance(product["ingredients"], list):
            logger.debug("Using structured ingredients data")
            for ingredient in product["ingredients"]:
                # Get the ingredient name - try English version first
                ingredient_name = (
                    ingredient.get("id", "").replace("en:", "") or 
                    ingredient.get("text", "")
                ).strip()
                
                if ingredient_name:
                    ingredients_list.append(ingredient_name)
                    
                    # Check if this might be an unhealthy ingredient
                    ingredient_lower = ingredient_name.lower()
                    if any(bad in ingredient_lower for bad in unhealthy_terms):
                        unhealthy_ingredients.append(ingredient_name)
        
        # If still no ingredients, try generic ingredients_text
        if not ingredients_list and "ingredients_text" in product:
            logger.debug("Falling back to generic ingredients text")
            ingredients_text = product.get("ingredients_text", "")
            if ingredients_text:
                ingredients_list = [item.strip() for item in ingredients_text.split(",") if item.strip()]
                
                # Check for unhealthy ingredients in the text
                for ingredient in ingredients_list:
                    if any(bad in ingredient.lower() for bad in unhealthy_terms):
                        unhealthy_ingredients.append(ingredient)
        
        # Get product image URL
        image_url = product.get("image_front_url", "")
        
        # Format ingredients for display
        ingredients_text = ", ".join(ingredients_list) if ingredients_list else "No ingredients information available"
        unhealthy_text = ", ".join(unhealthy_ingredients) if unhealthy_ingredients else "None detected"
        
        # Add debug logging for better troubleshooting
        logger.debug(f"Extracted product: {product_name}")
        logger.debug(f"Extracted ingredients: {ingredients_text[:100]}...")
        
        return {
            "name": product_name,
            "description": product.get("generic_name_en", product.get("generic_name", "No description available")),
            "ingredients": ingredients_text,
            "unhealthy_ingredients": unhealthy_text,
            "image_url": image_url,
            "barcode": barcode_number
        }

    except requests.RequestException as e:
        logger.error(f"API request failed: {str(e)}", exc_info=True)
        return {
            "error": f"API request failed: {str(e)}",
            "barcode": barcode_number
        }
    except Exception as e:
        logger.error(f"Error processing product data: {str(e)}", exc_info=True)
        return {
            "error": f"Error processing product data: {str(e)}",
            "barcode": barcode_number
        }

@app.route('/scan', methods=['POST', 'OPTIONS'])
def scan_barcode():
    """Handle barcode scanning requests."""
    # Handle preflight OPTIONS requests
    if request.method == 'OPTIONS':
        response = app.make_default_options_response()
        return response
        
    try:
        # Log request headers for debugging
        logger.debug(f"Request headers: {dict(request.headers)}")
        logger.debug(f"Request origin: {request.headers.get('Origin', 'Not specified')}")
        logger.debug(f"Request content type: {request.headers.get('Content-Type', 'Not specified')}")
        
        if 'image' not in request.files:
            logger.error("No image file in request")
            return jsonify({"error": "No image file provided"}), 400

        file = request.files['image']
        logger.debug(f"Received image file: {file.filename}, Content-Type: {file.content_type}")
        
        try:
            # Read image data
            image_data = file.read()
            image = Image.open(io.BytesIO(image_data))
            
            # Convert to RGB if needed
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Convert PIL Image to numpy array
            image_array = np.array(image)
            logger.debug(f"Converted image to numpy array, shape: {image_array.shape}")
            
            # Process the image
            result = preprocess_image(image_array)
            logger.debug(f"Process result: {result}")
            
            # Ensure we're returning a valid JSON response
            if result is None:
                return jsonify({
                    "name": "No Product Found",
                    "description": "Could not detect a barcode in the image",
                    "ingredients": "",
                    "barcode": ""
                })
                
            return jsonify(result)
            
        except Exception as e:
            logger.error(f"Error processing image file: {e}", exc_info=True)
            return jsonify({"error": f"Error processing image: {str(e)}"}), 400
        
    except Exception as e:
        logger.error(f"Unexpected error in scan_barcode: {e}", exc_info=True)
        return jsonify({"error": f"Server error: {str(e)}"}), 500

@app.route('/cors-test', methods=['GET', 'OPTIONS'])
def cors_test():
    """Simple endpoint to test CORS configuration."""
    if request.method == 'OPTIONS':
        response = app.make_default_options_response()
        return response
        
    return jsonify({
        "message": "CORS is working correctly",
        "origin": request.headers.get('Origin', 'Not specified')
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=True)