from sqlalchemy import Column, Integer, String, Enum, ForeignKey, Time
from sqlalchemy.orm import relationship
from app.database.connection import Base

class Timetable(Base):
    __tablename__ = "timetables"

    id = Column(Integer, primary_key=True, index=True)
    day = Column(Enum('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'))
    start_time = Column(Time)
    end_time = Column(Time)
    
    class_id = Column(Integer, ForeignKey("classes.id"))
    subject_id = Column(Integer, ForeignKey("subjects.id"))
    teacher_id = Column(Integer, ForeignKey("teachers.id"))
    classroom_id = Column(Integer, ForeignKey("classrooms.id"))

    # Relationships
    class_name = relationship("Class")
    subject = relationship("Subject")
    teacher = relationship("Teacher")
    classroom = relationship("Classroom")
