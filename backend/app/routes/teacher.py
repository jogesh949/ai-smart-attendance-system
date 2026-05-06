import subprocess
import sys
import os
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.connection import SessionLocal
from app.routes.auth import get_current_user
from app.models.teacher import Teacher
from app.models.student import Student
from app.models.user import User
from app.models.class_model import Class
from app.models.department import Department
from app.models.attendance_record import AttendanceRecord
from app.models.attendance_session import AttendanceSession
from app.models.subject import Subject
from app.models.attendance_session import AttendanceSession

router = APIRouter(prefix="/teacher", tags=["Teacher"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/search-student")
def search_student(
    query: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Only teacher allowed")

    # Search by name or roll no (case-insensitive)
    results = db.query(Student, User.name, User.email, Class.name.label("class_name"))\
        .join(User, Student.user_id == User.id)\
        .join(Class, Student.class_id == Class.id)\
        .filter(User.role == 'student')\
        .filter((User.name.ilike(f"%{query}%")) | (Student.roll_no.ilike(f"%{query}%")))\
        .limit(10).all()

    return [{
        "id": r[0].id,
        "name": r[1],
        "email": r[2],
        "roll_no": r[0].roll_no,
        "class_name": r[3]
    } for r in results]

@router.get("/student-details/{student_id}")
def get_student_details(
    student_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Only teacher allowed")

    student_data = db.query(Student, User.name, User.email, Class.name.label("class_name"), Department.name.label("dept_name"))\
        .join(User, Student.user_id == User.id)\
        .join(Class, Student.class_id == Class.id)\
        .join(Department, Class.department_id == Department.id)\
        .filter(Student.id == student_id).first()

    if not student_data:
        raise HTTPException(status_code=404, detail="Student not found")

    # Get attendance history
    attendance_records = db.query(AttendanceRecord, Subject.name, AttendanceSession.start_time)\
        .join(AttendanceSession, AttendanceRecord.session_id == AttendanceSession.id)\
        .join(Subject, AttendanceSession.subject_id == Subject.id)\
        .filter(AttendanceRecord.student_id == student_id)\
        .order_by(AttendanceSession.start_time.desc()).all()

    history = [{
        "subject": r[1],
        "date": r[2].strftime("%Y-%m-%d %H:%M"),
        "status": r[0].status
    } for r in attendance_records]

    return {
        "profile": {
            "id": student_data[0].id,
            "name": student_data[1],
            "email": student_data[2],
            "roll_no": student_data[0].roll_no,
            "class": student_data[3],
            "department": student_data[4]
        },
        "attendance_history": history
    }

from pydantic import BaseModel

class SessionRequest(BaseModel):
    class_id: int
    subject_id: int
    classroom_id: int


@router.post("/start-session")
def start_session(
    data: SessionRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Only teacher allowed")

    teacher = db.query(Teacher).filter(
        Teacher.user_id == current_user.id
    ).first()

    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")

    session = AttendanceSession(
        class_id=data.class_id,
        subject_id=data.subject_id,
        teacher_id=teacher.id,
        classroom_id=data.classroom_id
    )

    db.add(session)
    db.commit()
    db.refresh(session)

    return {
        "message": "Session started and AI Camera launched",
        "session_id": session.id
    }

@router.post("/stop-session")
def stop_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    session = db.query(AttendanceSession).filter(
        AttendanceSession.id == session_id
    ).first()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    session.status = "completed"
    session.end_time = datetime.utcnow()

    db.commit()

    return {"message": "Session stopped"}
