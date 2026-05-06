from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.database.connection import Base


class Classroom(Base):
    __tablename__ = "classrooms"

    id = Column(Integer, primary_key=True, index=True)
    room_name = Column(String(50))
    location = Column(String(100))

    cameras = relationship("Camera", back_populates="classroom", cascade="all, delete-orphan")