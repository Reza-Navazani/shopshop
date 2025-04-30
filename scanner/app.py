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
CORS(app, origins=["https://blue-desert-00651801e.6.azurestaticapps.net", 
                   "http://localhost:3000", 
                   "http://localhost:5173",
                   "https://scanner-bmfhhwf0a5drhrb7.canadacentral-01.azurewebsites.net"])

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
    # Convert image to OpenCV format
    image = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)

    # Run YOLOv8 for barcode detection
    results = model(image)
    detected_barcodes = []

    for result in results:
        for box in result.boxes:
            x1, y1, x2, y2 = map(int, box.xyxy[0])  # Get bounding box

            # Crop the barcode region
            barcode_region = image[y1:y2, x1:x2]

            # Decode barcode using Pyzbar
            barcodes = decode(barcode_region)
            for barcode in barcodes:
                barcode_data = barcode.data.decode("utf-8")
                if barcode_data:
                  barcode_number = barcode_data  # First detected text
                  product = lookup_product(barcode_number)  # Call the lookup function
                  response_time = time.time() - start_time
                  response_text=f"Response Time: {response_time:.4f} seconds"
                  return product    


def lookup_product(barcode_number):
    """Fetches product details using a barcode number."""
    try:
        BARCODE_API_URL = "https://world.openfoodfacts.org/api/v0/product/"
        KEY = "formatted=y&key=wsogsc4e53t7o7iafcoud1od1mlhxn"
        link = f"{BARCODE_API_URL}{barcode_number}{KEY}{".json"}"
        
        response = requests.get(link)
        response.raise_for_status()

        product_data = response.json()
        product_data_one = product_data
        #product_data_one = product_data.get("products", [{}])[0]
        
        return {
            "name": product_data_one.get("product_name", "Unknown Product"),
            "description": product_data_one.get("_keywords", "No description available"),
            "ingredients": product_data_one.get("ingredients", "No ingredients information available"),
            "barcode": barcode_number
        }

    except requests.RequestException as e:
        logger.error(f"API request failed: {str(e)}", exc_info=True)
        return {
            "error": f"API request failed: {str(e)}",
            "barcode": barcode_number
        }

@app.route('/scan', methods=['POST'])
def scan_barcode():
    """Handle barcode scanning requests."""
    try:
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
            result= preprocess_image(image_array)
            logger.debug(f"Process result: {result}")
            return jsonify(result)
            
        except Exception as e:
            logger.error(f"Error processing image file: {e}", exc_info=True)
            return jsonify({"error": f"Error processing image: {str(e)}"}), 400
        
    except Exception as e:
        logger.error(f"Unexpected error in scan_barcode: {e}", exc_info=True)
        return jsonify({"error": f"Server error: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=True)