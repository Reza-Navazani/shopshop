from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

# Don't import from main to avoid circular imports
# We'll use this model with a db instance passed from outside
db = None

class UserPreference:
    __tablename__ = 'user_preferences'
    
    id = None
    user_id = None
    allergies = None
    ingredients_to_avoid = None
    brands_of_interest = None
    price_preference = None
    store_preference = None
    created_at = None
    updated_at = None
    
    def __init__(self, db_instance):
        global db
        db = db_instance
        
        # Create the actual model class using the db instance
        class UserPreferenceModel(db.Model):
            __tablename__ = 'user_preferences'
            
            id = db.Column(db.Integer, primary_key=True)
            user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
            allergies = db.Column(db.Text, nullable=True)
            ingredients_to_avoid = db.Column(db.Text, nullable=True)
            brands_of_interest = db.Column(db.Text, nullable=True)
            price_preference = db.Column(db.String(50), nullable=True)
            store_preference = db.Column(db.String(100), nullable=True)
            created_at = db.Column(db.DateTime, default=datetime.utcnow)
            updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
            
            # Define relationship with User model
            user = db.relationship('UserModel', backref='preferences')
            
            def to_dict(self):
                return {
                    'id': self.id,
                    'user_id': self.user_id,
                    'allergies': self.allergies,
                    'ingredients_to_avoid': self.ingredients_to_avoid,
                    'brands_of_interest': self.brands_of_interest,
                    'price_preference': self.price_preference,
                    'store_preference': self.store_preference,
                    'created_at': self.created_at.isoformat() if self.created_at else None,
                    'updated_at': self.updated_at.isoformat() if self.updated_at else None
                }
        
        # Store the model class for use
        self.Model = UserPreferenceModel
        
    def get_model(self):
        return self.Model