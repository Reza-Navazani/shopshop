#!/bin/bash
# Startup script for running the Flask application on Azure Web App
cd /home/site/wwwroot

# Make sure Python environment is activated
source /home/site/wwwroot/antenv/bin/activate

# Install any dependencies that might be missing
pip install -r requirements.txt

# Run the Flask application using Gunicorn
exec gunicorn --bind=0.0.0.0:8000 --timeout 600 wsgi:app