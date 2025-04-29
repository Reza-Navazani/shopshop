"""
WSGI entry point for Azure App Service.
This is a standard file that Azure can use to start your application.
"""
from main import app as application

# This allows Azure to find the Flask app using WSGI standards
app = application

if __name__ == '__main__':
    app.run()