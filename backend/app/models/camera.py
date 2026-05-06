from sqlalchemy import Column, Integer, String, Enum, ForeignKey, JSON, DateTime, Boolean, Float
from sqlalchemy.orm import relationship
from app.database.connection import Base
from datetime import datetime

class Camera(Base):
    __tablename__ = "cameras"

    id = Column(Integer, primary_key=True, index=True)
    classroom_id = Column(Integer, ForeignKey("classrooms.id"))
    name = Column(String(100))
    camera_type = Column(Enum('Webcam', 'USB Camera', 'CCTV', 'IP Camera'))
    source_url = Column(String(255))  # Index for USB or URL for IP
    position = Column(Enum('Front', 'Back', 'Door', 'Ceiling'))
    resolution = Column(String(50), default="1280x720")
    fps = Column(Integer, default=30)
    status = Column(Enum('Active', 'Inactive'), default='Active')
    is_primary = Column(Boolean, default=False)
    notes = Column(String(255), nullable=True)
    
    # Analytics & Status
    last_active_time = Column(DateTime, nullable=True)
    current_status = Column(Enum('Online', 'Offline', 'Connecting', 'Error'), default='Offline')
    detection_count = Column(Integer, default=0)
    total_sessions_used = Column(Integer, default=0)
    
    classroom = relationship("Classroom", back_populates="cameras")

# Update Classroom model to include cameras relationship if not already present
