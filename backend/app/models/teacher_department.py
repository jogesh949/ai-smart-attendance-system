from sqlalchemy import Column, Integer, ForeignKey, Table
from app.database.connection import Base

teacher_department_association = Table(
    "teacher_departments",
    Base.metadata,
    Column("teacher_id", Integer, ForeignKey("teachers.id"), primary_key=True),
    Column("department_id", Integer, ForeignKey("departments.id"), primary_key=True)
)
