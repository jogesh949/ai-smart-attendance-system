import os
import time
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.connection import SessionLocal
from app.routes.auth import get_current_user
from app.services.face_service import get_face_embedding

from app.models.student import Student
from app.models.face_embedding import FaceEmbedding
from app.models.attendance_record import AttendanceRecord


router = APIRouter(prefix="/student", tags=["Student"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/upload-face")
async def upload_face(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Only student can upload face")

    student = db.query(Student).filter(Student.user_id == current_user.id).first()

    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # Check if student already has 10 photos
    existing_count = db.query(FaceEmbedding).filter(FaceEmbedding.student_id == student.id).count()
    if existing_count >= 10:
        raise HTTPException(status_code=400, detail="Maximum limit of 10 photos reached. Please contact admin to reset.")

    image_bytes = await file.read()
    
    # Ensure upload directory exists
    UPLOAD_DIR = "uploads/faces"
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    
    # Save the photo with a unique filename (nanoseconds to avoid collision)
    filename = f"{student.id}_{int(time.time_ns())}.jpg"
    file_path = os.path.join(UPLOAD_DIR, filename)
    with open(file_path, "wb") as f:
        f.write(image_bytes)

    embedding = get_face_embedding(image_bytes)

    # We still need the embedding for automated attendance, 
    # but we store the image path regardless.
    new_embedding = FaceEmbedding(
        student_id=student.id,
        embedding=str(embedding) if embedding else None,
        image_path=file_path
    )

    db.add(new_embedding)
    db.commit()

    if embedding is None:
        return {
            "message": "Photo saved to database, but no face was detected by AI. You may need to upload a clearer photo for automated attendance.",
            "face_detected": False
        }

    return {"message": "Face uploaded and processed successfully", "face_detected": True}


from app.models.attendance_session import AttendanceSession
from app.models.subject import Subject

# ... (rest of the imports)

@router.get("/attendance")
def get_student_attendance(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Only student allowed")

    student = db.query(Student).filter(Student.user_id == current_user.id).first()

    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # Join Record -> Session -> Subject to get names and details
    query_results = db.query(
        AttendanceRecord,
        Subject.name.label("subject_name")
    ).join(
        AttendanceSession, AttendanceRecord.session_id == AttendanceSession.id
    ).join(
        Subject, AttendanceSession.subject_id == Subject.id
    ).filter(
        AttendanceRecord.student_id == student.id
    ).all()

    # Group by subject
    subject_stats = {}
    total_classes = 0
    total_present = 0

    for record, subject_name in query_results:
        if subject_name not in subject_stats:
            subject_stats[subject_name] = {"attended": 0, "total": 0}
        
        subject_stats[subject_name]["total"] += 1
        total_classes += 1
        
        if record.status == "Present":
            subject_stats[subject_name]["attended"] += 1
            total_present += 1
        elif record.status == "Late":
            # Late counts as half attendance for percentage but 1 for total
            subject_stats[subject_name]["attended"] += 0.5
            total_present += 0.5

    # Format for response
    records_summary = []
    for name, stats in subject_stats.items():
        records_summary.append({
            "subject": name,
            "attended": stats["attended"],
            "total": stats["total"],
            "percentage": round((stats["attended"] / stats["total"] * 100), 2) if stats["total"] > 0 else 0
        })

    overall_percentage = (total_present / total_classes * 100) if total_classes > 0 else 0

    return {
        "summary": records_summary,
        "overall_percentage": round(overall_percentage, 2),
        "total_sessions": total_classes,
        "total_present": total_present
    }