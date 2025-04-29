#!/bin/bash

# This script builds the React frontend and prepares the deployment package

echo "Starting deployment preparation script"

# Define paths
REPO_ROOT=$(dirname "$(dirname "$0")")
FRONTEND_DIR="$REPO_ROOT/dynamic-ui"
BACKEND_DIR="$REPO_ROOT/dynamic-server"
FRONTEND_BUILD_DIR="$FRONTEND_DIR/dist"

echo "Repository root: $REPO_ROOT"
echo "Frontend directory: $FRONTEND_DIR"
echo "Backend directory: $BACKEND_DIR"

# Build the React frontend
echo "Building React frontend..."
cd "$FRONTEND_DIR" || { echo "Failed to change to frontend directory"; exit 1; }

# Make sure Node.js dependencies are installed
echo "Installing frontend dependencies..."
npm install || { echo "Failed to install frontend dependencies"; exit 1; }

# Build the React app
echo "Running npm build..."
npm run build || { echo "Failed to build frontend"; exit 1; }

echo "Frontend build completed successfully"

# Make sure the backend's static directory exists
echo "Ensuring backend can serve frontend assets..."

# Copy frontend build to a location the backend can access
echo "Copying frontend build to backend..."
mkdir -p "$BACKEND_DIR/static"
cp -r "$FRONTEND_BUILD_DIR"/* "$BACKEND_DIR/static/" || { echo "Failed to copy frontend build"; exit 1; }

# Ensure startup.sh has executable permissions
chmod +x "$BACKEND_DIR/startup.sh"
echo "Added executable permissions to startup.sh"

# Convert line endings to Unix format (important for Azure Linux environments)
if command -v dos2unix &> /dev/null; then
    dos2unix "$BACKEND_DIR/startup.sh"
    echo "Converted startup.sh line endings to Unix format"
else
    echo "Warning: dos2unix not found. Line endings might cause issues in Linux environment."
    # Alternative approach if dos2unix is not available
    if command -v sed &> /dev/null; then
        sed -i 's/\r$//' "$BACKEND_DIR/startup.sh"
        echo "Used sed to convert line endings to Unix format"
    fi
fi

# Print confirmation
echo "Deployment preparation completed successfully"