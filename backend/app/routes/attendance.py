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
from app.models.camera import Camera
from app.services.face_service import get_face_embedding, compare_faces, get_faces_with_details, parse_embedding

from app.models.teacher import Teacher
from app.models.class_model import Class
from datetime import datetime

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

    # Find classroom from timetable if possible, or use a default
    # For now, let's try to find a mapping or use a fallback
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
def end_session(session_id: int, db: Session = Depends(get_db)):
    session = db.query(AttendanceSession).filter(AttendanceSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session.status = "completed"
    session.end_time = datetime.utcnow()
    db.commit()
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
        # Create if not exists (should be initialized though)
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
        emb = parse_embedding(e.embedding)
        if emb:
            known.append((e.student_id, emb))

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

        # ✅ Real-time sync with AttendanceRecord
        record = db.query(AttendanceRecord).filter(
            AttendanceRecord.student_id == student_id,
            AttendanceRecord.session_id == session_id
        ).first()

        if record:
            # Count logs to determine status
            log_count = db.query(AttendanceLog).filter(
                AttendanceLog.student_id == student_id,
                AttendanceLog.session_id == session_id
            ).count()

            if log_count >= 5: # Require 5 confirmations for official 'Present'
                record.status = "Present"
                record.percentage = 100
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
        if count >= 1: # Any detection is enough
            status = "Present"
            percentage = 100
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
    db = SessionLocal()
    
    # Get session and mapped camera
    session = db.query(AttendanceSession).filter(AttendanceSession.id == session_id).first()
    camera_source = 0 # Default to webcam 0
    
    if session:
        # Find primary camera for this classroom
        primary_camera = db.query(Camera).filter(
            Camera.classroom_id == session.classroom_id,
            Camera.is_primary == True,
            Camera.status == 'Active'
        ).first()
        
        if primary_camera:
            camera_source = primary_camera.source_url
            if camera_source.isdigit():
                camera_source = int(camera_source)
            print(f"DEBUG: Using mapped camera: {primary_camera.name} ({camera_source})")
        else:
            print("DEBUG: No primary camera mapped. Falling back to default webcam (0).")

    # Use CAP_DSHOW on Windows for faster webcam access if it's a local index
    if isinstance(camera_source, int):
        cap = cv2.VideoCapture(camera_source, cv2.CAP_DSHOW)
    else:
        cap = cv2.VideoCapture(camera_source)

    if not cap.isOpened():
        print(f"ERROR: Could not open primary camera source: {camera_source}. Trying fallback 0...")
        camera_source = 0
        cap = cv2.VideoCapture(camera_source, cv2.CAP_DSHOW)
        
        if not cap.isOpened():
            print("ERROR: Fallback camera also failed.")
            db.close()
            return

    # Set resolution for better quality
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
    
    # Map student ID to names for overlay
    students = db.query(Student, User.name).join(User, Student.user_id == User.id).all()
    name_map = {s[0].id: s[1] for s in students}
    
    embeddings = db.query(FaceEmbedding).all()
    known = []
    for e in embeddings:
        emb = parse_embedding(e.embedding)
        if emb:
            known.append((e.student_id, emb))

    # Tracking for automatic marking
    frame_counts = {} # student_id -> count
    CONFIRM_FRAMES = 3
    marked_ids = set()
    
    # Pre-populate marked_ids from existing logs
    existing_logs = db.query(AttendanceLog).filter(AttendanceLog.session_id == session_id).all()
    for log in existing_logs:
        marked_ids.add(log.student_id)

    db.close()
    
    frame_count = 0
    
    while True:
        # Check session status every 100 frames to reduce DB load
        if frame_count % 100 == 0:
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
            # Create an error frame instead of just breaking
            error_frame = np.zeros((720, 1280, 3), dtype=np.uint8)
            cv2.putText(error_frame, "Camera Source Error / Disconnected", (300, 360), 
                        cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
            _, err_buffer = cv2.imencode('.jpg', error_frame)
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + err_buffer.tobytes() + b'\r\n')
            time.sleep(2) # Wait before retry or exit
            break
            
        frame_count += 1
            
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

            # --- AUTOMATIC MARKING LOGIC ---
            if student_id and student_id not in marked_ids:
                frame_counts[student_id] = frame_counts.get(student_id, 0) + 1
                
                if frame_counts[student_id] >= CONFIRM_FRAMES:
                    # Mark in DB
                    try:
                        mark_db = SessionLocal()
                        # Check again inside session to be safe
                        exists = mark_db.query(AttendanceLog).filter(
                            AttendanceLog.student_id == student_id,
                            AttendanceLog.session_id == session_id
                        ).first()
                        
                        if not exists:
                            new_log = AttendanceLog(
                                student_id=student_id,
                                session_id=session_id,
                                confidence=confidence / 100.0
                            )
                            mark_db.add(new_log)
                            mark_db.commit()
                            
                            # ✅ Real-time sync with AttendanceRecord
                            record = mark_db.query(AttendanceRecord).filter(
                                AttendanceRecord.student_id == student_id,
                                AttendanceRecord.session_id == session_id
                            ).first()

                            if record:
                                log_count = mark_db.query(AttendanceLog).filter(
                                    AttendanceLog.student_id == student_id,
                                    AttendanceLog.session_id == session_id
                                ).count()

                                if log_count >= 5: # Require 5 confirmations for official 'Present'
                                    record.status = "Present"
                                    record.percentage = 100
                                mark_db.commit()

                            print(f"✅ Automatically marked Student {student_id} present via live feed")
                        
                        marked_ids.add(student_id)
                        mark_db.close()
                    except Exception as e:
                        print(f"❌ Error auto-marking: {e}")

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
