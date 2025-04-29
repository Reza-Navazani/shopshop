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
bash ./create-deployment-package.sh

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
az webapp deployment source config-zip --resource-group $RESOURCE_GROUP --name $APP_SERVICE_NAME --src "./dynamic-server.zip"

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