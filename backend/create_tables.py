from app.database.connection import engine, Base
import app.models
import pymysql

# This script manually creates the cameras table if it doesn't exist
try:
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully")
except Exception as e:
    print(f"Error creating tables: {e}")
