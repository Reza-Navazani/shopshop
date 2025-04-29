#!/bin/bash

# Azure deployment script for dynamic-server application
# Run this script from the root of your project

echo "Starting Azure deployment process..."

# Ensure we're in the project root
cd "$(dirname "$0")"

# Create deployment package directory if it doesn't exist
DEPLOY_DIR="./deploy_package"
mkdir -p "$DEPLOY_DIR"

# Build the frontend and copy to backend static folder
echo "Building frontend and preparing backend..."
bash ./deploy-prep.sh

# Create a deployment package
echo "Creating deployment package..."

# Define paths
SCRIPT_DIR=$(dirname "$0")
REPO_ROOT="$SCRIPT_DIR"
DEPLOY_PACKAGE_DIR="$REPO_ROOT/deploy_package"
BACKEND_DIR="$REPO_ROOT/dynamic-server"

# Create deployment package directory (clean if exists)
if [ -d "$DEPLOY_PACKAGE_DIR" ]; then
    rm -rf "$DEPLOY_PACKAGE_DIR"
fi
mkdir -p "$DEPLOY_PACKAGE_DIR"

# Copy backend code to deployment directory
echo "Copying backend files..."
cp -r "$BACKEND_DIR"/* "$DEPLOY_PACKAGE_DIR/"

# Copy the startup script to the root of the deployment package
echo "Copying startup script..."
cp "$REPO_ROOT/startup.sh" "$DEPLOY_PACKAGE_DIR/"

# Copy requirements.txt to the root as well for redundancy
echo "Copying requirements.txt to root..."
cp "$BACKEND_DIR/requirements.txt" "$DEPLOY_PACKAGE_DIR/"

# Ensure correct permissions
echo "Setting file permissions..."
chmod +x "$DEPLOY_PACKAGE_DIR/startup.sh"

# Create a simple web.config to ensure Azure can properly deploy
echo "Creating web.config..."
cat > "$DEPLOY_PACKAGE_DIR/web.config" << EOF
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <handlers>
      <add name="PythonHandler" path="*" verb="*" modules="httpPlatformHandler" resourceType="Unspecified" />
    </handlers>
    <httpPlatform processPath="%HOME%\site\wwwroot\startup.sh"
                  arguments=""
                  stdoutLogEnabled="true"
                  stdoutLogFile="%HOME%\LogFiles\python.log"
                  startupTimeLimit="600">
      <environmentVariables>
        <environmentVariable name="PORT" value="%HTTP_PLATFORM_PORT%" />
      </environmentVariables>
    </httpPlatform>
  </system.webServer>
</configuration>
EOF

# Create a .deployment file to guide Azure's deployment
echo "Creating .deployment file..."
cat > "$DEPLOY_PACKAGE_DIR/.deployment" << EOF
[config]
command = bash startup.sh
EOF

# Create archive from deployment directory
echo "Creating archive..."
cd "$DEPLOY_PACKAGE_DIR" || { echo "Failed to change to deployment directory"; exit 1; }
zip -r "$REPO_ROOT/azure-deploy.zip" * .* -x "**/__pycache__/*" -x "**/.git/*" -x "**/.vscode/*" -x "**/.idea/*"

echo "Deployment package created at: $REPO_ROOT/azure-deploy.zip"
echo "You can now upload this package to Azure App Service."

# Set these variables to match your Azure setup
RESOURCE_GROUP="shop_assist_agent"
APP_SERVICE_NAME="shopper-agent"  # Update this to match your actual app service name

# Restart the web app to ensure clean deployment
echo "Restarting the Azure App Service..."
az webapp restart --resource-group $RESOURCE_GROUP --name $APP_SERVICE_NAME

# Wait a moment for the restart to complete
sleep 10

# Deploy the application
echo "Deploying to Azure App Service..."
az webapp deployment source config-zip --resource-group $RESOURCE_GROUP --name $APP_SERVICE_NAME --src "./azure-deploy.zip"

# Set application settings
echo "Configuring application settings..."
az webapp config set --resource-group $RESOURCE_GROUP --name $APP_SERVICE_NAME \
  --linux-fx-version "PYTHON|3.13"

# Set startup command to use the full path to the startup script
echo "Setting startup command to use root-level startup.sh..."
az webapp config appsettings set --resource-group $RESOURCE_GROUP --name $APP_SERVICE_NAME \
  --settings SCM_DO_BUILD_DURING_DEPLOYMENT=true \
            WEBSITE_RUN_FROM_PACKAGE=0 \
            COMMAND="startup.sh"

# Ensure startup script is executable after deployment
echo "Setting script permissions..."
az webapp ssh --resource-group $RESOURCE_GROUP --name $APP_SERVICE_NAME \
  --command "chmod +x /home/site/wwwroot/startup.sh" || \
  echo "Could not set permissions via SSH. Will retry after deployment."

# Try to set permissions again through a different method if SSH failed
az webapp ssh --resource-group $RESOURCE_GROUP --name $APP_SERVICE_NAME \
  --command "find /home/site/wwwroot -name '*.sh' -exec chmod +x {} \;" || \
  echo "Could not set permissions through SSH. Check if script is executable."

echo "Deployment completed. Check Azure portal for status."