"""
Application entry point for Azure App Service.
This file serves as an alternative entry point for Azure deployments.
"""
from main import app

# This allows Azure to find the Flask app
if __name__ == '__main__':
    app.run()