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

# Ensure the required files in the backend directory have appropriate permissions
echo "Setting file permissions..."
chmod +x "$BACKEND_DIR/startup.sh"

# Create a .deployment file to guide Azure's deployment process
echo "Creating .deployment file..."
cat > "$BACKEND_DIR/.deployment" << EOF
[config]
command = bash startup.sh
EOF

# Make sure web.config exists in the deployment
if [ ! -f "$BACKEND_DIR/web.config" ]; then
    echo "web.config not found, creating it..."
    cat > "$BACKEND_DIR/web.config" << EOF
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <handlers>
      <add name="PythonHandler" path="*" verb="*" modules="httpPlatformHandler" resourceType="Unspecified"/>
    </handlers>
    <httpPlatform processPath="%PYTHON_PATH%"
                  arguments="/home/site/wwwroot/startup.sh"
                  stdoutLogEnabled="true"
                  stdoutLogFile="%HOME%/LogFiles/stdout"
                  startupTimeLimit="180"
                  processesPerApplication="1" />
  </system.webServer>
</configuration>
EOF
fi

# Create the zip file from the backend directory
echo "Creating zip archive from $BACKEND_DIR..."
cd "$BACKEND_DIR" || { echo "Failed to change to backend directory"; exit 1; }
zip -r "$OUTPUT_ZIP" * .deployment -x "**/__pycache__/*" -x "**/.git/*" -x "**/.vscode/*" -x "**/.idea/*"

echo "Deployment package created at: $OUTPUT_ZIP"
echo "You can now deploy this package to Azure App Service."