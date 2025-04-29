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

# Check if we're in an Oryx deployment where files may be extracted elsewhere
if [ -f "$ROOT_DIR/oryx-manifest.toml" ] && [ -f "$ROOT_DIR/output.tar.gz" ]; then
    echo "Detected Oryx deployment with compressed output"
    # Try to find the application directory by checking typical temp directories
    for TEMP_DIR in /tmp/* ; do
        if [ -d "$TEMP_DIR" ] && [ -f "$TEMP_DIR/main.py" -o -d "$TEMP_DIR/dynamic-server" ]; then
            echo "Found application files in temporary directory: $TEMP_DIR"
            ROOT_DIR="$TEMP_DIR"
            break
        fi
    done
fi

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
        # Last resort - search for main.py in subdirectories
        echo "Searching for main.py in subdirectories..."
        MAIN_PY_DIR=$(find "$ROOT_DIR" -name "main.py" -type f -print 2>/dev/null | head -n 1 | xargs dirname 2>/dev/null)
        if [ -n "$MAIN_PY_DIR" ]; then
            APP_DIR="$MAIN_PY_DIR"
            echo "Found main.py in: $APP_DIR"
        else
            echo "ERROR: Could not find application files in expected locations"
            echo "Directory contents:"
            ls -la "$ROOT_DIR"
            exit 1
        fi
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

# Check for a pre-installed virtual environment
VENV_DIR=""
if [ -d "/tmp/8dd86d3bd8dd9f7/antenv" ]; then
    echo "Using pre-installed antenv virtual environment"
    VENV_DIR="/tmp/8dd86d3bd8dd9f7/antenv"
elif [ -d "$ROOT_DIR/antenv" ]; then
    echo "Using antenv virtual environment in root directory"
    VENV_DIR="$ROOT_DIR/antenv"
fi

# If we have a virtual environment, use it
if [ -n "$VENV_DIR" ]; then
    echo "Activating virtual environment: $VENV_DIR"
    source "$VENV_DIR/bin/activate" || echo "Warning: Failed to activate virtual environment"
else
    echo "No virtual environment found, using system Python"
fi

# Make sure the static directory exists
STATIC_DIR="$APP_DIR/static"
mkdir -p "$STATIC_DIR"

# Create a basic index.html if it doesn't exist
if [ ! -f "$STATIC_DIR/index.html" ]; then
    echo "<html><body><h1>API Server Running</h1><p>The static files were not built correctly.</p></body></html>" > "$STATIC_DIR/index.html"
    echo "Created a basic index.html file in the static directory."
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

# Check if gunicorn is installed, if not install it
if ! command -v gunicorn &> /dev/null; then
    echo "Installing gunicorn..."
    python -m pip install --quiet gunicorn
fi

# Start the application with gunicorn - increase timeout and include timing info
echo "Starting application with gunicorn $(date)..."
echo "Command: gunicorn --bind=0.0.0.0:$PORT --timeout 600 --access-logfile - --error-logfile - main:app"
gunicorn --bind=0.0.0.0:$PORT --timeout 600 --access-logfile - --error-logfile - main:app