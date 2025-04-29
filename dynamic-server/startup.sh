#!/bin/bash
# Startup script for running the Flask application on Azure Web App
cd /home/site/wwwroot

# Azure Python app service containers handle the Python environment differently
# The Python environment is already active in the container

# Install any dependencies that might be missing
pip install -r requirements.txt

# Run the Flask application using Gunicorn
# Make sure to listen on the port expected by Azure (port 8000)
exec gunicorn --bind=0.0.0.0:8000 --timeout 600 --access-logfile '-' --error-logfile '-' wsgi:app