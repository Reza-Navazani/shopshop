#!/usr/bin/env python
# init_db.py - Run this script to initialize the database

import os
import sys
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Create a minimal Flask app for database initialization
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///shop_assist.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize extensions
db = SQLAlchemy(app)
bcrypt = Bcrypt(app)

# Initialize the User model with our db and bcrypt instances
from models.user_model import User
user_instance = User(db, bcrypt)
UserModel = user_instance.get_model()

# Initialize the UserProduct model with our db instance
from models.user_product_model import UserProduct
user_product_instance = UserProduct(db)
UserProductModel = user_product_instance.get_model()

# Initialize the UserPreference model with our db instance
from models.user_preference_model import UserPreference
user_preference_instance = UserPreference(db)
UserPreferenceModel = user_preference_instance.get_model()

def init_db():
    with app.app_context():
        logger.info("Creating database tables...")
        db.create_all()
        logger.info("Database tables created successfully")

        # Check if we need to create a demo user
        if not UserModel.query.filter_by(username='demo').first():
            logger.info("Creating demo user...")
            demo_user = UserModel(
                username='demo',
                email='demo@example.com',
                first_name='Demo',
                last_name='User',
                preferred_store='Walmart',
                dietary_preferences='Vegetarian, No nuts'
            )
            demo_user.set_password('password123')
            db.session.add(demo_user)
            db.session.commit()
            logger.info("Demo user created successfully")

if __name__ == '__main__':
    try:
        init_db()
        logger.info("Database initialization completed successfully!")
    except Exception as e:
        logger.error(f"Error initializing database: {str(e)}")
        sys.exit(1)