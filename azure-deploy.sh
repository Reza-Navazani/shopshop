#!/bin/bash

# Azure deployment script for the dynamic-server application
# This script creates a deployment package and deploys it to Azure

set -e  # Exit immediately if a command exits with a non-zero status

echo "===== Starting Azure deployment process ====="

# First, run the preparation script
./prepare-deployment.sh

# Navigate to the deployment package directory
cd deploy_package

echo "===== Creating compressed deployment package ====="

# First check if virtual environment exists
if [ ! -d "antenv" ]; then
    echo "ERROR: Virtual environment not found. Please run prepare-deployment.sh first."
    exit 1
fi

# Create a deployment zip file
# Important: We need to preserve the virtual environment paths
echo "Creating deployment zip file..."
zip -r deployment.zip . -x "antenv/*" "*.git*"

# Get Azure account info
SUBSCRIPTION=$(az account show --query id -o tsv 2>/dev/null || echo "")
if [ -z "$SUBSCRIPTION" ]; then
    echo "You need to log in to Azure first."
    az login
fi

# Get resource group - either from parameter or prompt user
RESOURCE_GROUP=${1:-""}
if [ -z "$RESOURCE_GROUP" ]; then
    read -p "Enter your Azure Resource Group name: " RESOURCE_GROUP
fi

# Get app name - either from parameter or prompt user
APP_NAME=${2:-"shopper-agent"}
if [ -z "$APP_NAME" ]; then
    read -p "Enter your Azure Web App name: " APP_NAME
fi

# Check if the web app exists
WEBAPP_EXISTS=$(az webapp list --resource-group "$RESOURCE_GROUP" --query "[?name=='$APP_NAME'].name" -o tsv)

if [ -z "$WEBAPP_EXISTS" ]; then
    # Create a new web app if it doesn't exist
    echo "Creating new web app $APP_NAME in resource group $RESOURCE_GROUP..."
    
    # Get location - either from parameter or prompt user
    LOCATION=${3:-""}
    if [ -z "$LOCATION" ]; then
        # Show available locations
        echo "Available locations:"
        az account list-locations --query "[].name" -o tsv | head -n 10
        read -p "Enter Azure region (location) for deployment: " LOCATION
    fi
    
    echo "Creating web app with Python 3.13 runtime..."
    az webapp create \
        --resource-group "$RESOURCE_GROUP" \
        --plan "$APP_NAME-plan" \
        --name "$APP_NAME" \
        --runtime "PYTHON:3.13" \
        --location "$LOCATION" \
        --sku B1
else
    echo "Web app $APP_NAME already exists in resource group $RESOURCE_GROUP."
fi

# Configure the web app
echo "Configuring web app settings..."
az webapp config set \
    --resource-group "$RESOURCE_GROUP" \
    --name "$APP_NAME" \
    --startup-file "dynamic-server/startup.sh" \
    --python-version 3.13

# Set environment variables as needed
echo "Setting environment variables..."
az webapp config appsettings set \
    --resource-group "$RESOURCE_GROUP" \
    --name "$APP_NAME" \
    --settings \
        SCM_DO_BUILD_DURING_DEPLOYMENT=true \
        ENABLE_ORYX_BUILD=true

# Deploy the zip file
echo "Deploying application to Azure..."
az webapp deployment source config-zip \
    --resource-group "$RESOURCE_GROUP" \
    --name "$APP_NAME" \
    --src "deployment.zip"

# Clean up
rm deployment.zip

echo "===== Deployment completed ====="
echo "Application URL: https://$APP_NAME.azurewebsites.net"
echo "To watch the logs, run: az webapp log tail --name $APP_NAME --resource-group $RESOURCE_GROUP"