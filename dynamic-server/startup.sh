#!/bin/bash

# Startup script for Azure Web App
echo "Starting application..."

# Add any environment setup here if needed
# export SOME_ENV_VAR=value

# Start gunicorn with the application
gunicorn --bind=0.0.0.0:8000 --timeout 600 application:app