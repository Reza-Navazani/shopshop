#!/bin/bash

# Pre-deployment script for Azure App Service (Linux) 
# This script prepares the deployment package with pre-installed dependencies

set -e  # Exit immediately if a command exits with a non-zero status

echo "=== Starting deployment package preparation ==="
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTPUT_DIR="$SCRIPT_DIR/deploy_package"
SERVER_DIR="$SCRIPT_DIR/dynamic-server"

# Create output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

# Clean previous build if exists
if [ -d "$OUTPUT_DIR/antenv" ]; then
    echo "Removing previous virtual environment..."
    rm -rf "$OUTPUT_DIR/antenv"
fi

# Create a virtual environment for the deployment
echo "Creating virtual environment..."
python -m venv "$OUTPUT_DIR/antenv"
source "$OUTPUT_DIR/antenv/bin/activate"

# Upgrade pip
echo "Upgrading pip..."
python -m pip install --upgrade pip

# Install required packages
echo "Installing dependencies..."
python -m pip install -r "$SERVER_DIR/requirements.txt"

# Create deployment structure
echo "Setting up deployment structure..."
mkdir -p "$OUTPUT_DIR/dynamic-server"

# Copy server files
echo "Copying server files..."
cp -r "$SERVER_DIR"/* "$OUTPUT_DIR/dynamic-server/"

# If static UI files exist, copy them
if [ -d "$SCRIPT_DIR/dynamic-ui/dist" ]; then
    echo "Copying UI build files..."
    mkdir -p "$OUTPUT_DIR/dynamic-server/static"
    cp -r "$SCRIPT_DIR/dynamic-ui/dist/"* "$OUTPUT_DIR/dynamic-server/static/"
fi

# Make startup script executable 
chmod +x "$OUTPUT_DIR/dynamic-server/startup.sh"

# Create a lightweight deployment requirements file that assumes dependencies are already installed
cat > "$OUTPUT_DIR/dynamic-server/requirements-deploy.txt" << EOL
gunicorn==21.2.0
flask>=3.0.0
flask-cors>=4.0.0
python-dotenv>=1.0.0
EOL

# Create a deployment .deployment file
cat > "$OUTPUT_DIR/.deployment" << EOL
[config]
SCM_DO_BUILD_DURING_DEPLOYMENT=true
ENABLE_ORYX_BUILD=true
EOL

# Create a lightweight deployment requirements file in the root
cp "$OUTPUT_DIR/dynamic-server/requirements-deploy.txt" "$OUTPUT_DIR/requirements.txt"

# Create the azure deploy script
cat > "$OUTPUT_DIR/deploy.sh" << EOL
#!/bin/bash
cd "\$(dirname "\$0")"
echo "Deploying application from pre-built package..."

# Deploy with minimal dependency installation
# The heavy dependencies should already be in the virtual environment
az webapp up --runtime "PYTHON:3.13" --sku B1 --name shopper-agent --resource-group your-resource-group
EOL
chmod +x "$OUTPUT_DIR/deploy.sh"

# Create a .gitignore file to avoid committing the virtual environment
cat > "$OUTPUT_DIR/.gitignore" << EOL
antenv/
__pycache__/
*.py[cod]
*$py.class
.env
EOL

echo "=== Deployment package ready at $OUTPUT_DIR ==="
echo "To deploy the application:"
echo "1. Navigate to the deploy_package directory"
echo "2. Run './deploy.sh' or use Azure CLI to deploy"
echo "3. Alternatively, zip the contents and deploy via Azure Portal"

# Copy the deployment readme
cat > "$OUTPUT_DIR/DEPLOY-README.md" << EOL
# Deployment Package for Azure App Service

This package contains a pre-configured deployment with dependencies already installed
in the 'antenv' virtual environment. This significantly reduces startup time in Azure
by avoiding installing heavy packages during app startup.

## Deployment Options:

### 1. Using Azure CLI:
\`\`\`bash
./deploy.sh
\`\`\`

### 2. Manual deployment via the Azure Portal:
1. Zip the contents of this directory (excluding 'antenv')
2. Upload the zip file through the Azure Portal deployment center

### 3. Using GitHub Actions:
Set up a GitHub workflow that copies these files to your deployment target

## Important Notes:
- The virtual environment contains pre-installed dependencies
- Only lightweight dependencies are installed during deployment
- The startup script will use the pre-installed environment when available
EOL

echo "Done!"