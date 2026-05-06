from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
import cv2
import numpy as np
import ast
import time

from app.database.connection import SessionLocal
from app.models.user import User
from app.models.face_embedding import FaceEmbedding
from app.models.attendance_logs import AttendanceLog
from app.models.attendance_record import AttendanceRecord
from app.models.student import Student
from app.models.attendance_session import AttendanceSession
from app.services.face_service import get_face_embedding, compare_faces, get_faces_with_details

router = APIRouter(prefix="/attendance", tags=["Attendance"])


# DB Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# =========================
# MARK ATTENDANCE
# =========================
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

    # Load all embeddings
    embeddings = db.query(FaceEmbedding).all()

    known = []
    for e in embeddings:
        if e.embedding:
            known.append((e.student_id, ast.literal_eval(e.embedding)))

    # Compare face
    student_id, confidence = compare_faces(known, new_embedding)

    if student_id:
        # ✅ Check duplicate log
        existing_log = db.query(AttendanceLog).filter(
            AttendanceLog.student_id == student_id,
            AttendanceLog.session_id == session_id
        ).first()

        if existing_log:
            return {
                "message": "Attendance already marked",
                "student_id": student_id,
                "confidence": confidence
            }

        # ✅ Save log
        log = AttendanceLog(
            student_id=student_id,
            session_id=session_id,
            confidence=confidence / 100.0
        )

        db.add(log)
        db.commit()

        return {
            "message": "Attendance marked",
            "student_id": student_id
        }

    # ❌ Not recognized
    return {"message": "Face not recognized"}


# =========================
# FINALIZE ATTENDANCE
# =========================
@router.post("/finalize/{session_id}")
def finalize_attendance(session_id: int, db: Session = Depends(get_db)):

    session = db.query(AttendanceSession).filter(
        AttendanceSession.id == session_id
    ).first()

    if not session:
        return {"error": "Session not found"}

    # Get students with names
    students = db.query(Student, User.name).join(User, Student.user_id == User.id).filter(
        Student.class_id == session.class_id
    ).all()

    # Get logs
    logs = db.query(AttendanceLog).filter(
        AttendanceLog.session_id == session_id
    ).all()

    # Count detections
    detection_count = {}
    for log in logs:
        detection_count[log.student_id] = detection_count.get(log.student_id, 0) + 1

    results = []

    for student_data in students:
        student = student_data[0]
        student_name = student_data[1]
        count = detection_count.get(student.id, 0)

        # ✅ Better logic
        if count >= 3:
            status = "Present"
            percentage = 100
        elif count > 0:
            status = "Late"
            percentage = 50
        else:
            status = "Absent"
            percentage = 0

        # Avoid duplicate records
        existing_record = db.query(AttendanceRecord).filter(
            AttendanceRecord.student_id == student.id,
            AttendanceRecord.session_id == session_id
        ).first()

        if not existing_record:
            existing_record = AttendanceRecord(
                student_id=student.id,
                session_id=session_id,
                status=status,
                percentage=percentage
            )
            db.add(existing_record)
            db.commit()
            db.refresh(existing_record)

        results.append({
            "id": existing_record.id,
            "student_id": student.id,
            "student_name": student_name,
            "status": existing_record.status,
            "percentage": existing_record.percentage
        })

    # Mark session complete
    session.status = "completed"

    db.commit()

    return {
        "message": "Attendance finalized",
        "results": results
    }


# =========================
# UPDATE ATTENDANCE (MANUAL)
# =========================
class UpdateAttendanceRequest(BaseModel):
    status: str
    percentage: float

@router.patch("/record/{record_id}")
def update_attendance_record(
    record_id: int, 
    data: UpdateAttendanceRequest, 
    db: Session = Depends(get_db)
):
    record = db.query(AttendanceRecord).filter(AttendanceRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    
    record.status = data.status
    record.percentage = data.percentage
    db.commit()
    return {"message": "Attendance updated successfully"}


# =========================
# INITIALIZE ATTENDANCE (MANUAL TAKE)
# =========================
@router.post("/initialize/{session_id}")
def initialize_attendance(session_id: int, db: Session = Depends(get_db)):
    session = db.query(AttendanceSession).filter(AttendanceSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Get all students in this class with names
    students = db.query(Student, User.name).join(User, Student.user_id == User.id).filter(
        Student.class_id == session.class_id
    ).all()
    
    results = []
    for student_data in students:
        student = student_data[0]
        student_name = student_data[1]
        
        # Check if record already exists
        record = db.query(AttendanceRecord).filter(
            AttendanceRecord.student_id == student.id,
            AttendanceRecord.session_id == session_id
        ).first()

        if not record:
            # Create default "Absent" record
            record = AttendanceRecord(
                student_id=student.id,
                session_id=session_id,
                status="Absent",
                percentage=0
            )
            db.add(record)
            db.commit()
            db.refresh(record)

        results.append({
            "id": record.id,
            "student_id": student.id,
            "student_name": student_name,
            "status": record.status,
            "percentage": record.percentage
        })

    return {
        "message": "Attendance list initialized",
        "results": results
    }

# =========================
# LIVE VIDEO STREAM
# =========================

def generate_frames(session_id: int):
    cap = cv2.VideoCapture(0)
    
    db = SessionLocal()
    # Map student ID to names for overlay
    students = db.query(Student, User.name).join(User, Student.user_id == User.id).all()
    name_map = {s[0].id: s[1] for s in students}
    
    embeddings = db.query(FaceEmbedding).all()
    known = []
    for e in embeddings:
        if e.embedding:
            try:
                known.append((e.student_id, ast.literal_eval(e.embedding)))
            except:
                continue
    db.close()

    while True:
        # Check session status every 5 seconds
        try:
            check_db = SessionLocal()
            curr_session = check_db.query(AttendanceSession).filter(AttendanceSession.id == session_id).first()
            if not curr_session or curr_session.status == 'completed':
                check_db.close()
                break
            check_db.close()
        except:
            pass

        success, frame = cap.read()
        if not success:
            break
            
        # Detect faces and draw overlays
        _, buffer = cv2.imencode(".jpg", frame)
        details = get_faces_with_details(buffer.tobytes())
        
        for face in details:
            bbox = face["bbox"]
            student_id, confidence = compare_faces(known, face["embedding"])
            
            # Draw box
            x1, y1, x2, y2 = [int(v) for v in bbox]
            color = (0, 255, 0) if student_id else (0, 0, 255) # Green if known, Red if unknown
            cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
            
            # Label
            name = name_map.get(student_id, "Unknown") if student_id else "Unknown Face"
            label = f"{name} ({confidence}%)"
            
            cv2.putText(frame, label, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)

        # Encode frame for streaming
        _, final_buffer = cv2.imencode('.jpg', frame)
        frame_bytes = final_buffer.tobytes()
        
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
    
    cap.release()

@router.get("/live-feed/{session_id}")
async def live_feed(session_id: int):
    return StreamingResponse(
        generate_frames(session_id),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )
