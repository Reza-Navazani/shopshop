from datetime import datetime

class UserProduct:
    def __init__(self, db):
        self.db = db
        self.Model = self.create_model()

    def create_model(self):
        db = self.db

        class UserProductModel(db.Model):
            __tablename__ = 'user_products'
            
            id = db.Column(db.Integer, primary_key=True)
            user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
            barcode = db.Column(db.String(100), nullable=False)
            product_name = db.Column(db.String(200), nullable=False)
            scan_date = db.Column(db.DateTime, default=db.func.current_timestamp())
            
            # We don't need to define the relationship here since it's handled in UserModel
            # The backref in UserModel will automatically create a 'user' attribute here
            
            def to_dict(self):
                return {
                    'id': self.id,
                    'user_id': self.user_id,
                    'barcode': self.barcode,
                    'product_name': self.product_name,
                    'scan_date': self.scan_date.isoformat() if self.scan_date else None,
                    'username': self.user.username if self.user else None
                }
                
        return UserProductModel
        
    def get_model(self):
        return self.Model