#!/bin/bash

# Azure deployment script for dynamic-server application
# Run this script from the root of your project

echo "Starting Azure deployment process..."

# Ensure we're in the project root
cd "$(dirname "$0")"

# Build the frontend and copy to backend static folder
echo "Building frontend and preparing backend..."
bash ./deploy-prep.sh

# Deploy to Azure using the az CLI
echo "Deploying to Azure App Service..."

# Set these variables to match your Azure setup
RESOURCE_GROUP="your-resource-group"
APP_SERVICE_NAME="your-app-service-name"

# Deploy the application
az webapp deployment source config-zip --resource-group $RESOURCE_GROUP --name $APP_SERVICE_NAME --src "./dynamic-server.zip"

echo "Deployment completed. Check Azure portal for status."