#!/bin/bash
# Startup script for running the Flask application on Azure Web App
cd /home/site/wwwroot

echo "Starting application in directory: $(pwd)"
echo "Python version: $(python --version)"

# Install any dependencies that might be missing
echo "Installing dependencies..."
pip install -r requirements.txt

# Print out installed packages for debugging
echo "Installed packages:"
pip list

# Make sure application files are accessible
echo "Checking application files..."
if [ -f "wsgi.py" ]; then
  echo "wsgi.py found"
else
  echo "ERROR: wsgi.py not found!"
  exit 1
fi

if [ -f "main.py" ]; then
  echo "main.py found"
else
  echo "ERROR: main.py not found!"
  exit 1
fi

# Run the Flask application using Gunicorn
echo "Starting application with Gunicorn..."
exec gunicorn --bind=0.0.0.0:8000 --timeout 600 --workers 2 --access-logfile '-' --error-logfile '-' wsgi:app