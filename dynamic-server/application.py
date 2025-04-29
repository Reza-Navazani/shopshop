"""
Application entry point for Azure App Service.
This file serves as an alternative entry point for Azure deployments.
"""
from main import app

# This is the object that Azure App Service will look for
app = app

if __name__ == '__main__':
    app.run()