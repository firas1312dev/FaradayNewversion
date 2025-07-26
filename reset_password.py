#!/usr/bin/env python3
"""
Script to reset the Faraday admin password
"""
import psycopg2
from werkzeug.security import generate_password_hash
import sys

def reset_faraday_password():
    # Database connection parameters (adjust if needed)
    db_config = {
        'host': 'localhost',
        'port': 5432,
        'database': 'faraday',
        'user': 'postgres',
        'password': 'postgres'
    }
    
    new_password = 'faraday'
    username = 'faraday'
    
    try:
        # Connect to PostgreSQL database
        conn = psycopg2.connect(**db_config)
        cursor = conn.cursor()
        
        # Hash the new password (using bcrypt which Faraday uses)
        # We need to use the same hashing method that Flask-Security uses
        from flask_security.utils import hash_password
        
        # For direct database access, we'll use a simple bcrypt hash
        import bcrypt
        password_hash = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        # Update the user's password
        cursor.execute(
            "UPDATE faraday_user SET password = %s WHERE username = %s",
            (password_hash, username)
        )
        
        if cursor.rowcount > 0:
            conn.commit()
            print(f"Successfully updated password for user '{username}' to '{new_password}'")
        else:
            print(f"User '{username}' not found in database")
            
    except Exception as e:
        print(f"Error updating password: {e}")
        if 'conn' in locals():
            conn.rollback()
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    reset_faraday_password()
