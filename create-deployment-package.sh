#!/bin/bash

# This script creates a zip file for Azure deployment after the build process

echo "Creating deployment zip package..."

# Define paths
REPO_ROOT=$(dirname "$0")
BACKEND_DIR="$REPO_ROOT/dynamic-server"
OUTPUT_ZIP="$REPO_ROOT/dynamic-server.zip"

# Make sure we're in the right directory
cd "$REPO_ROOT" || { echo "Failed to change to repository root"; exit 1; }

# Remove any existing zip file
if [ -f "$OUTPUT_ZIP" ]; then
    echo "Removing existing zip file..."
    rm "$OUTPUT_ZIP"
fi

# Create the zip file from the backend directory
echo "Creating zip archive from $BACKEND_DIR..."
cd "$BACKEND_DIR" || { echo "Failed to change to backend directory"; exit 1; }
zip -r "$OUTPUT_ZIP" * -x "**/__pycache__/*" -x "**/.git/*" -x "**/.vscode/*" -x "**/.idea/*"

echo "Deployment package created at: $OUTPUT_ZIP"
echo "You can now deploy this package to Azure App Service."