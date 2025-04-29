#!/bin/bash

# Print startup information for diagnostics
echo "Starting application deployment $(date)"

# Determine the application directory
if [ -d "/home/site/wwwroot" ]; then
    ROOT_DIR="/home/site/wwwroot"
else
    # Fallback to current directory
    ROOT_DIR=$(pwd)
fi

echo "Root directory: $ROOT_DIR"

# Check if we're in the right directory structure
if [ -d "$ROOT_DIR/dynamic-server" ]; then
    # If we have a dynamic-server directory, use that
    APP_DIR="$ROOT_DIR/dynamic-server"
    echo "Found dynamic-server directory at: $APP_DIR"
elif [ -f "$ROOT_DIR/main.py" ]; then
    # If main.py is in the root, use that
    APP_DIR="$ROOT_DIR"
    echo "Found main.py in root directory"
else
    # Check if this might be the dynamic-server directory already
    if [ -f "$ROOT_DIR/application.py" ] || [ -f "$ROOT_DIR/wsgi.py" ]; then
        APP_DIR="$ROOT_DIR"
        echo "Treating current directory as dynamic-server"
    else
        echo "ERROR: Could not find application files in expected locations"
        echo "Directory contents:"
        ls -la "$ROOT_DIR"
        exit 1
    fi
fi

echo "Application directory: $APP_DIR"
cd "$APP_DIR" || { echo "Failed to change to application directory"; exit 1; }

# Print environment information for debugging
echo "Python version:"
python --version
echo "Working directory: $(pwd)"
echo "Directory contents:"
ls -la

# Install dependencies
echo "Installing Python dependencies..."
python -m pip install --upgrade pip
if [ -f "requirements.txt" ]; then
    python -m pip install -r requirements.txt
else
    echo "WARNING: requirements.txt not found in $APP_DIR"
    # Try to find requirements.txt in other locations
    if [ -f "$ROOT_DIR/requirements.txt" ]; then
        echo "Found requirements.txt in $ROOT_DIR"
        python -m pip install -r "$ROOT_DIR/requirements.txt"
    else
        echo "ERROR: Could not find requirements.txt in any expected location"
    fi
fi

# Check if we need to build the React frontend (only on first deployment)
STATIC_DIR="$APP_DIR/static"
if [ ! -d "$STATIC_DIR" ] || [ ! -f "$STATIC_DIR/index.html" ]; then
    # Try to find the UI project
    echo "Static files not found, looking for UI project..."
    
    # Check if frontend is included in deployment
    if [ -d "$ROOT_DIR/dynamic-ui" ]; then
        UI_DIR="$ROOT_DIR/dynamic-ui"
    elif [ -d "$APP_DIR/../dynamic-ui" ]; then
        UI_DIR="$APP_DIR/../dynamic-ui"
    elif [ -d "$APP_DIR/dynamic-ui" ]; then
        UI_DIR="$APP_DIR/dynamic-ui"
    else
        echo "UI project not found. Creating a placeholder static directory."
        mkdir -p "$STATIC_DIR"
        echo "<html><body><h1>API Server Running</h1><p>The frontend is not included in this deployment.</p></body></html>" > "$STATIC_DIR/index.html"
        UI_DIR=""
    fi
    
    # If UI project was found, build it
    if [ -n "$UI_DIR" ]; then
        echo "Found UI project at: $UI_DIR"
        cd "$UI_DIR" || { echo "Failed to change to UI directory"; exit 1; }
        
        # Check if npm is available
        if command -v npm &> /dev/null; then
            echo "Building React frontend..."
            npm install
            npm run build
            
            # Copy the build to the static directory
            mkdir -p "$STATIC_DIR"
            if [ -d "$UI_DIR/dist" ]; then
                cp -r "$UI_DIR/dist/"* "$STATIC_DIR/"
                echo "Frontend build copied to static directory."
            else
                echo "Warning: Build directory not found after npm build."
            fi
        else
            echo "Warning: npm not available, cannot build frontend."
        fi
        
        # Return to the application directory
        cd "$APP_DIR" || { echo "Failed to return to application directory"; exit 1; }
    fi
else
    echo "Static directory exists, skipping frontend build."
fi

# Set environment variables
export FLASK_APP=main.py
export PORT="${WEBSITES_PORT:-${PORT:-8000}}"
echo "Using PORT: $PORT"

# Check if main.py exists
if [ ! -f "main.py" ]; then
    echo "ERROR: main.py not found in $(pwd)"
    echo "Directory contents:"
    ls -la
    exit 1
fi

# Start the application with gunicorn
echo "Starting application with gunicorn..."
echo "Command: gunicorn --bind=0.0.0.0:$PORT --timeout 600 --access-logfile - --error-logfile - main:app"
gunicorn --bind=0.0.0.0:$PORT --timeout 600 --access-logfile - --error-logfile - main:app