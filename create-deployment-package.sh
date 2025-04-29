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

# Ensure the required files have appropriate permissions
echo "Setting file permissions..."
chmod +x "$REPO_ROOT/startup.sh"

# Create a .deployment file to guide Azure's deployment process
echo "Creating .deployment file..."
cat > "$BACKEND_DIR/.deployment" << EOF
[config]
command = bash /home/site/wwwroot/startup.sh
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

# Create a temporary directory for deployment
TEMP_DEPLOY_DIR="$REPO_ROOT/temp_deploy"
mkdir -p "$TEMP_DEPLOY_DIR"

# Copy the backend files
echo "Copying backend files to temporary directory..."
cp -r "$BACKEND_DIR/"* "$TEMP_DEPLOY_DIR/"
cp -r "$BACKEND_DIR/.deployment" "$TEMP_DEPLOY_DIR/" 2>/dev/null || true

# Copy the root startup.sh to the deployment directory
echo "Copying root startup.sh to deployment package..."
cp "$REPO_ROOT/startup.sh" "$TEMP_DEPLOY_DIR/"

# Create the zip file from the temporary directory
echo "Creating zip archive..."
cd "$TEMP_DEPLOY_DIR" || { echo "Failed to change to temporary directory"; exit 1; }
zip -r "$OUTPUT_ZIP" * .deployment -x "**/__pycache__/*" -x "**/.git/*" -x "**/.vscode/*" -x "**/.idea/*"

# Clean up temporary directory
cd "$REPO_ROOT" || { echo "Failed to change back to repository root"; exit 1; }
rm -rf "$TEMP_DEPLOY_DIR"

echo "Deployment package created at: $OUTPUT_ZIP"
echo "You can now deploy this package to Azure App Service."