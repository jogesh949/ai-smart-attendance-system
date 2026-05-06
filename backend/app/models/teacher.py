from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database.connection import Base
from .teacher_department import teacher_department_association


class Teacher(Base):
    __tablename__ = "teachers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    teacher_code = Column(String(50), unique=True)

    departments = relationship("Department", secondary=teacher_department_association, backref="teachers")