from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import bcrypt

# Don't import from main to avoid circular imports
# We'll use this model with a db instance passed from outside
db = None
bcrypt_instance = None

class User:
    __tablename__ = 'users'
    
    id = None
    username = None
    email = None
    password_hash = None
    first_name = None
    last_name = None
    created_at = None
    updated_at = None
    profile_picture = None
    preferred_store = None
    dietary_preferences = None
    
    def __init__(self, db_instance, bcrypt):
        global db, bcrypt_instance
        db = db_instance
        bcrypt_instance = bcrypt
        
        # Create the actual model class using the db instance
        class UserModel(db.Model):
            __tablename__ = 'users'
            
            id = db.Column(db.Integer, primary_key=True)
            username = db.Column(db.String(50), unique=True, nullable=False)
            email = db.Column(db.String(100), unique=True, nullable=False)
            password_hash = db.Column(db.String(255), nullable=False)
            first_name = db.Column(db.String(50), nullable=True)
            last_name = db.Column(db.String(50), nullable=True)
            created_at = db.Column(db.DateTime, default=datetime.utcnow)
            updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
            
            # Optional profile fields
            profile_picture = db.Column(db.String(255), nullable=True)
            preferred_store = db.Column(db.String(100), nullable=True)
            dietary_preferences = db.Column(db.Text, nullable=True)
            
            # Define relationship using string for lazy resolution of circular dependency
            # No back_populates here - we'll handle it in user_product_model.py
            product_scans = db.relationship('UserProductModel', backref='user')
            
            def set_password(self, password):
                self.password_hash = bcrypt_instance.generate_password_hash(password).decode('utf-8')
                
            def check_password(self, password):
                return bcrypt_instance.check_password_hash(self.password_hash, password)
            
            def to_dict(self):
                return {
                    'id': self.id,
                    'username': self.username,
                    'email': self.email,
                    'first_name': self.first_name,
                    'last_name': self.last_name,
                    'profile_picture': self.profile_picture,
                    'preferred_store': self.preferred_store,
                    'dietary_preferences': self.dietary_preferences,
                    'created_at': self.created_at.isoformat() if self.created_at else None
                }
        
        # Store the model class for use
        self.Model = UserModel
        
    def get_model(self):
        return self.Model