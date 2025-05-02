import sqlite3

def add_image_url_column():
    try:
        print('Connecting to the database...')
        # Connect to the SQLite database
        conn = sqlite3.connect('shop_assist.db')
        cursor = conn.cursor()
        
        # Check if the column already exists
        print('Checking if image_url column exists...')
        cursor.execute('PRAGMA table_info(user_products)')
        columns = [col[1] for col in cursor.fetchall()]
        print(f'Existing columns: {columns}')
        
        if 'image_url' not in columns:
            print('Adding image_url column...')
            # Add the image_url column if it doesn't exist
            cursor.execute('ALTER TABLE user_products ADD COLUMN image_url TEXT')
            conn.commit()
            print('Successfully added image_url column to user_products table')
            
            # Verify the column was added
            cursor.execute('PRAGMA table_info(user_products)')
            columns = [col[1] for col in cursor.fetchall()]
            print(f'Updated columns: {columns}')
        else:
            print('image_url column already exists in user_products table')
        
        conn.close()
        print('Database connection closed')
        return True
    except Exception as e:
        print(f'Error: {e}')
        return False

if __name__ == '__main__':
    add_image_url_column()