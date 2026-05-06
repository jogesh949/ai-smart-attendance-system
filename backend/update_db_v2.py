from app.database.connection import engine, Base
from app.models.teacher_department import teacher_department_association
import pymysql

try:
    Base.metadata.create_all(bind=engine)
    print("Database tables created/updated successfully (including teacher_departments)")
except Exception as e:
    print(f"Error creating tables: {e}")
