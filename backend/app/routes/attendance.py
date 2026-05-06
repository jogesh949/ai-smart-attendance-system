from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
import cv2
import numpy as np
import ast
import time
import io
import csv
from datetime import datetime

from app.database.connection import SessionLocal
from app.models.user import User
from app.models.face_embedding import FaceEmbedding
from app.models.attendance_logs import AttendanceLog
from app.models.attendance_record import AttendanceRecord
from app.models.student import Student
from app.models.attendance_session import AttendanceSession
from app.models.camera import Camera
from app.models.timetable import Timetable
from app.models.teacher import Teacher
from app.models.class_model import Class
from app.models.subject import Subject
from app.services.face_service import get_face_embedding, compare_faces, get_faces_with_details, parse_embedding
from app.services.email_service import send_bulk_absence_emails
from app.routes import auth

router = APIRouter(prefix="/attendance", tags=["Attendance"])

# DB Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# =========================
# SESSION MANAGEMENT
# =========================

class SessionStartRequest(BaseModel):
    class_id: int
    subject_id: int

@router.post("/start")
def start_session(
    data: SessionStartRequest,
    db: Session = Depends(get_db),
    current_user = Depends(auth.get_current_user)
):
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can start sessions")

    teacher = db.query(Teacher).filter(Teacher.user_id == current_user.id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher profile not found")

    # Find classroom from timetable if possible
    classroom_id = 1 # Default fallback
    timetable_entry = db.query(Timetable).filter(
        Timetable.class_id == data.class_id,
        Timetable.subject_id == data.subject_id,
        Timetable.teacher_id == teacher.id
    ).first()
    
    if timetable_entry:
        classroom_id = timetable_entry.classroom_id

    session = AttendanceSession(
        class_id=data.class_id,
        subject_id=data.subject_id,
        teacher_id=teacher.id,
        classroom_id=classroom_id,
        status="active"
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    # Initialize records as Absent
    students = db.query(Student).filter(Student.class_id == data.class_id).all()
    for student in students:
        record = AttendanceRecord(
            student_id=student.id,
            session_id=session.id,
            status="Absent",
            percentage=0
        )
        db.add(record)
    db.commit()

    return {
        "id": session.id,
        "class_id": session.class_id,
        "subject_id": session.subject_id,
        "status": session.status
    }

@router.post("/end/{session_id}")
def end_session(session_id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    session = db.query(AttendanceSession).filter(AttendanceSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session.status = "completed"
    session.end_time = datetime.utcnow()
    db.commit()

    try:
        subject = db.query(Subject).filter(Subject.id == session.subject_id).first()
        subject_name = subject.name if subject else "Unknown Subject"
        date_str = session.start_time.strftime("%Y-%m-%d %H:%M")
        
        absent_records = db.query(AttendanceRecord, User.name, User.email).join(
            Student, AttendanceRecord.student_id == Student.id
        ).join(
            User, Student.user_id == User.id
        ).filter(
            AttendanceRecord.session_id == session_id,
            AttendanceRecord.status == "Absent"
        ).all()

        absent_students = [{"name": r[1], "email": r[2]} for r in absent_records if r[2]]
        
        if absent_students:
            background_tasks.add_task(send_bulk_absence_emails, absent_students, subject_name, date_str)
    except Exception as e:
        print(f"Failed to queue absence emails: {e}")

    return {"message": "Session ended"}

@router.get("/session/{session_id}")
def get_session_full_details(session_id: int, db: Session = Depends(get_db)):
    session = db.query(AttendanceSession).filter(AttendanceSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Get all students in the class
    students = db.query(Student, User.name).join(User, Student.user_id == User.id).filter(
        Student.class_id == session.class_id
    ).all()

    # Get existing logs/records
    records = db.query(AttendanceRecord).filter(AttendanceRecord.session_id == session_id).all()
    record_map = {r.student_id: r for r in records}

    logs = []
    for student, name in students:
        record = record_map.get(student.id)
        logs.append({
            "student_id": student.id,
            "student_name": name,
            "status": record.status.lower() if record else "absent"
        })

    return {
        "id": session.id,
        "status": session.status,
        "logs": logs
    }

class ManualMarkRequest(BaseModel):
    session_id: int
    student_id: int
    status: str

@router.post("/manual-mark")
def manual_mark(data: ManualMarkRequest, db: Session = Depends(get_db)):
    record = db.query(AttendanceRecord).filter(
        AttendanceRecord.session_id == data.session_id,
        AttendanceRecord.student_id == data.student_id
    ).first()

    if not record:
        record = AttendanceRecord(
            student_id=data.student_id,
            session_id=data.session_id,
            status=data.status.capitalize(),
            percentage=100 if data.status.lower() == "present" else 0
        )
        db.add(record)
    else:
        record.status = data.status.capitalize()
        record.percentage = 100 if data.status.lower() == "present" else 0
    
    db.commit()
    return {"message": "Manual attendance updated"}

# =========================
# EXPORT ATTENDANCE (CSV)
# =========================
@router.get("/export/{session_id}")
def export_attendance(session_id: int, db: Session = Depends(get_db)):
    session = db.query(AttendanceSession).filter(AttendanceSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    records = db.query(AttendanceRecord, User.name, Student.roll_no).join(
        Student, AttendanceRecord.student_id == Student.id
    ).join(
        User, Student.user_id == User.id
    ).filter(AttendanceRecord.session_id == session_id).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Roll No", "Student Name", "Status", "Percentage"])

    for record, name, roll_no in records:
        writer.writerow([roll_no, name, record.status, f"{record.percentage}%"])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=attendance_session_{session_id}.csv"}
    )

# =========================
# MARK ATTENDANCE (AI)
# =========================

CONFIRM_FRAMES_REQUIRED = 3

@router.post("/mark")
async def mark_attendance(
    file: UploadFile = File(...),
    session_id: int = Form(...),
    db: Session = Depends(get_db)
):
    image_bytes = await file.read()
    new_embedding = get_face_embedding(image_bytes)

    if new_embedding is None:
        return {"message": "No face detected"}

    embeddings = db.query(FaceEmbedding).all()
    known = []
    for e in embeddings:
        emb = parse_embedding(e.embedding)
        if emb:
            known.append((e.student_id, emb))

    student_id, confidence = compare_faces(known, new_embedding)

    if student_id:
        existing_log = db.query(AttendanceLog).filter(
            AttendanceLog.student_id == student_id,
            AttendanceLog.session_id == session_id
        ).first()

        if existing_log:
            return {"message": "Attendance already logged", "student_id": student_id}

        log = AttendanceLog(
            student_id=student_id,
            session_id=session_id,
            confidence=confidence / 100.0
        )
        db.add(log)
        db.commit()

        record = db.query(AttendanceRecord).filter(
            AttendanceRecord.student_id == student_id,
            AttendanceRecord.session_id == session_id
        ).first()

        if record:
            log_count = db.query(AttendanceLog).filter(
                AttendanceLog.student_id == student_id,
                AttendanceLog.session_id == session_id
            ).count()

            if log_count >= CONFIRM_FRAMES_REQUIRED:
                record.status = "Present"
                record.percentage = 100
            db.commit()

        return {"message": "Attendance marked", "student_id": student_id}

    return {"message": "Face not recognized"}

# =========================
# LIVE VIDEO STREAM
# =========================

def generate_frames(session_id: int):
    db = SessionLocal()
    try:
        session = db.query(AttendanceSession).filter(AttendanceSession.id == session_id).first()
        camera_source = 0
        
        if session:
            primary_camera = db.query(Camera).filter(
                Camera.classroom_id == session.classroom_id,
                Camera.is_primary == True,
                Camera.status == 'Active'
            ).first()
            
            if primary_camera:
                camera_source = primary_camera.source_url
                if camera_source.isdigit():
                    camera_source = int(camera_source)

        if isinstance(camera_source, int):
            cap = cv2.VideoCapture(camera_source, cv2.CAP_DSHOW)
        else:
            cap = cv2.VideoCapture(camera_source)

        if not cap.isOpened():
            cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)
            if not cap.isOpened():
                return

        cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
        
        students = db.query(Student, User.name).join(User, Student.user_id == User.id).all()
        name_map = {s[0].id: s[1] for s in students}
        
        embeddings = db.query(FaceEmbedding).all()
        known = []
        for e in embeddings:
            emb = parse_embedding(e.embedding)
            if emb:
                known.append((e.student_id, emb))

        frame_counts = {}
        marked_ids = set()
        
        existing_logs = db.query(AttendanceLog).filter(AttendanceLog.session_id == session_id).all()
        for log in existing_logs:
            marked_ids.add(log.student_id)

        frame_count = 0
        while True:
            if frame_count % 100 == 0:
                # Refresh session status
                db.expire_all()
                curr_session = db.query(AttendanceSession).filter(AttendanceSession.id == session_id).first()
                if not curr_session or curr_session.status == 'completed':
                    break

            success, frame = cap.read()
            if not success:
                break
                
            frame_count += 1
            _, buffer = cv2.imencode(".jpg", frame)
            details = get_faces_with_details(buffer.tobytes())
            
            for face in details:
                bbox = face["bbox"]
                student_id, confidence = compare_faces(known, face["embedding"])
                
                x1, y1, x2, y2 = [int(v) for v in bbox]
                color = (0, 255, 0) if student_id else (0, 0, 255)
                cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
                
                name = name_map.get(student_id, "Unknown") if student_id else "Unknown Face"
                cv2.putText(frame, f"{name} ({confidence}%)", (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)

                if student_id and student_id not in marked_ids:
                    frame_counts[student_id] = frame_counts.get(student_id, 0) + 1
                    if frame_counts[student_id] >= CONFIRM_FRAMES_REQUIRED:
                        exists = db.query(AttendanceLog).filter(
                            AttendanceLog.student_id == student_id,
                            AttendanceLog.session_id == session_id
                        ).first()
                        
                        if not exists:
                            new_log = AttendanceLog(
                                student_id=student_id,
                                session_id=session_id,
                                confidence=confidence / 100.0
                            )
                            db.add(new_log)
                            db.commit()
                            
                            record = db.query(AttendanceRecord).filter(
                                AttendanceRecord.student_id == student_id,
                                AttendanceRecord.session_id == session_id
                            ).first()

                            if record:
                                record.status = "Present"
                                record.percentage = 100
                                db.commit()
                        
                        marked_ids.add(student_id)

            _, final_buffer = cv2.imencode('.jpg', frame)
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + final_buffer.tobytes() + b'\r\n')
        
        cap.release()
    finally:
        db.close()

@router.get("/live-feed/{session_id}")
async def live_feed(session_id: int):
    return StreamingResponse(
        generate_frames(session_id),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )
