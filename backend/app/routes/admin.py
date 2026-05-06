from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from pydantic import BaseModel
from app.database.connection import SessionLocal
from app.models.department import Department
from app.models.classroom import Classroom
from app.models.class_model import Class
from app.models.subject import Subject
from app.models.teacher import Teacher
from app.models.user import User
from app.models.student import Student
from app.models.face_embedding import FaceEmbedding
from app.models.attendance_record import AttendanceRecord
from app.models.attendance_session import AttendanceSession
from app.routes.auth import get_current_user
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str):
    return pwd_context.hash(password)

router = APIRouter(prefix="/admin", tags=["Admin"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

from datetime import datetime, date
from sqlalchemy import func

# ... (inside router)

@router.get("/stats")
def get_admin_stats(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admin allowed")
    
    total_students = db.query(Student).count()
    total_teachers = db.query(Teacher).count()
    total_departments = db.query(Department).count()
    total_classes = db.query(Class).count()
    
    # Today's attendance
    today = date.today()
    present_today = db.query(AttendanceRecord).join(AttendanceSession).filter(
        func.date(AttendanceSession.start_time) == today,
        AttendanceRecord.status == "Present"
    ).count()
    
    absent_today = total_students - present_today
    attendance_percentage = round((present_today / total_students * 100), 2) if total_students > 0 else 0
    
    return {
        "total_students": total_students,
        "total_teachers": total_teachers,
        "total_departments": total_departments,
        "total_classes": total_classes,
        "present_today": present_today,
        "absent_today": max(0, absent_today),
        "attendance_percentage": attendance_percentage
    }

class DepartmentRequest(BaseModel):
    name: str

@router.post("/departments")
def add_department(data: DepartmentRequest, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admin allowed")
    dept = Department(name=data.name)
    db.add(dept)
    db.commit()
    db.refresh(dept)
    return dept

@router.get("/departments")
def get_departments(db: Session = Depends(get_db)):
    return db.query(Department).all()

@router.delete("/departments/{id}")
def delete_department(id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admin allowed")
    dept = db.query(Department).filter(Department.id == id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    db.delete(dept)
    db.commit()
    return {"message": "Department deleted"}

# --- CLASSES ---

class ClassRequest(BaseModel):
    name: str
    department_id: int

@router.post("/classes")
def add_class(data: ClassRequest, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admin allowed")
    cls = Class(name=data.name, department_id=data.department_id)
    db.add(cls)
    db.commit()
    db.refresh(cls)
    return cls

@router.get("/classes")
def get_classes(db: Session = Depends(get_db)):
    # Join with department to get department name
    results = db.query(Class, Department.name.label("department_name")).join(Department, Class.department_id == Department.id).all()
    return [{"id": r[0].id, "name": r[0].name, "department_id": r[0].department_id, "department_name": r[1]} for r in results]

@router.delete("/classes/{id}")
def delete_class(id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admin allowed")
    cls = db.query(Class).filter(Class.id == id).first()
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")
    db.delete(cls)
    db.commit()
    return {"message": "Class deleted"}

# --- SUBJECTS ---

class SubjectRequest(BaseModel):
    name: str
    department_id: int

@router.post("/subjects")
def add_subject(data: SubjectRequest, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admin allowed")
    sub = Subject(name=data.name, department_id=data.department_id)
    db.add(sub)
    db.commit()
    db.refresh(sub)
    return sub

@router.get("/subjects")
def get_subjects(db: Session = Depends(get_db)):
    results = db.query(Subject, Department.name.label("department_name")).join(Department, Subject.department_id == Department.id).all()
    return [{"id": r[0].id, "name": r[0].name, "department_id": r[0].department_id, "department_name": r[1]} for r in results]

@router.delete("/subjects/{id}")
def delete_subject(id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admin allowed")
    sub = db.query(Subject).filter(Subject.id == id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subject not found")
    db.delete(sub)
    db.commit()
    return {"message": "Subject deleted"}

# --- CLASSROOMS ---

class ClassroomRequest(BaseModel):
    room_name: str
    location: str

@router.post("/classrooms")
def add_classroom(data: ClassroomRequest, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admin allowed")
    room = Classroom(room_name=data.room_name, location=data.location)
    db.add(room)
    db.commit()
    db.refresh(room)
    return room

@router.get("/classrooms")
def get_classrooms(db: Session = Depends(get_db)):
    return db.query(Classroom).all()

# --- TEACHERS ---

class TeacherRequest(BaseModel):
    name: str
    email: str
    password: str
    department_id: int

@router.post("/teachers")
def add_teacher(data: TeacherRequest, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admin allowed")
    
    # create user
    user = User(
        name=data.name,
        email=data.email,
        password=hash_password(data.password),
        role="teacher"
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # create teacher
    teacher = Teacher(
        user_id=user.id,
        department_id=data.department_id,
        teacher_code=f"TCH{user.id}"
    )
    db.add(teacher)
    db.commit()
    return {"message": "Teacher added successfully"}

@router.get("/teachers")
def get_teachers(db: Session = Depends(get_db)):
    # Join with User and Department
    results = db.query(Teacher, User.name, User.email, Department.name.label("department_name"))\
                .join(User, Teacher.user_id == User.id)\
                .join(Department, Teacher.department_id == Department.id).all()
    return [{
        "id": r[0].id,
        "user_id": r[0].user_id,
        "name": r[1],
        "email": r[2],
        "department_name": r[3],
        "teacher_code": r[0].teacher_code
    } for r in results]

# --- STUDENTS ---

class StudentRequest(BaseModel):
    name: str
    email: str
    password: str
    roll_no: str
    class_id: int

@router.post("/students")
def add_student(data: StudentRequest, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admin allowed")
    
    # create user
    user = User(
        name=data.name,
        email=data.email,
        password=hash_password(data.password),
        role="student"
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # create student
    student = Student(
        user_id=user.id,
        class_id=data.class_id,
        roll_no=data.roll_no
    )
    db.add(student)
    db.commit()
    return {"message": "Student added successfully"}

@router.get("/students")
def get_students(db: Session = Depends(get_db)):
    try:
        # Use outer joins so students without a class or department still show up
        results = db.query(
            Student, 
            User.name, 
            User.email, 
            Class.name.label("class_name"), 
            Department.name.label("department_name")
        ).outerjoin(User, Student.user_id == User.id)\
         .outerjoin(Class, Student.class_id == Class.id)\
         .outerjoin(Department, Class.department_id == Department.id).all()

        return [{
            "id": r[0].id,
            "user_id": r[0].user_id,
            "name": r[1] or "Unknown Student",
            "email": r[2] or "N/A",
            "roll_no": r[0].roll_no or "N/A",
            "class_name": r[3] or "No Class",
            "department_name": r[4] or "No Department",
            "class_id": r[0].class_id
        } for r in results]
    except Exception as e:
        print(f"ERROR in get_students: {e}")
        return []

@router.get("/students/{id}/details")
def get_student_details_admin(id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admin allowed")
    
    try:
        print(f"DEBUG: Fetching details for student ID: {id}")
        # Fetch base student data with outer joins
        student_data = db.query(
            Student, 
            User.name, 
            User.email, 
            Class.name.label("class_name"), 
            Department.name.label("dept_name")
        ).outerjoin(User, Student.user_id == User.id)\
         .outerjoin(Class, Student.class_id == Class.id)\
         .outerjoin(Department, Class.department_id == Department.id)\
         .filter(Student.id == id).first()

        if not student_data:
            print(f"DEBUG: No student found with ID {id}")
            raise HTTPException(status_code=404, detail="Student not found")

        # Get attendance history with outer joins to sessions/subjects
        # Use outerjoin to ensure records show even if session/subject info is missing
        attendance_records = db.query(
            AttendanceRecord, 
            Subject.name.label("subject_name"), 
            AttendanceSession.start_time
        ).outerjoin(AttendanceSession, AttendanceRecord.session_id == AttendanceSession.id)\
         .outerjoin(Subject, AttendanceSession.subject_id == Subject.id)\
         .filter(AttendanceRecord.student_id == id)\
         .order_by(AttendanceSession.start_time.desc()).all()

        history = []
        total_sessions = len(attendance_records)
        attended_count = 0
        
        for r in attendance_records:
            record, subject_name, start_time = r
            history.append({
                "subject": subject_name or "Unknown Subject",
                "date": start_time.strftime("%Y-%m-%d %H:%M") if start_time else "Unknown Date",
                "status": record.status
            })
            if record.status == "Present":
                attended_count += 1
            elif record.status == "Late":
                attended_count += 0.5

        attendance_percentage = round((attended_count / total_sessions * 100), 2) if total_sessions > 0 else 0

        print(f"DEBUG: Found {len(history)} records for student ID {id}")

        return {
            "profile": {
                "id": student_data[0].id,
                "name": student_data[1] or "Unknown Name",
                "email": student_data[2] or "N/A",
                "roll_no": student_data[0].roll_no or "N/A",
                "class": student_data[3] or "No Class",
                "department": student_data[4] or "No Department"
            },
            "stats": {
                "total_sessions": total_sessions,
                "attended_count": attended_count,
                "attendance_percentage": attendance_percentage
            },
            "attendance_history": history
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR in get_student_details_admin ({id}): {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/students/{id}")
def delete_student(id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admin allowed")
    
    student = db.query(Student).filter(Student.id == id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    user_id = student.user_id
    
    # Delete related records
    db.query(FaceEmbedding).filter(FaceEmbedding.student_id == id).delete()
    db.query(AttendanceRecord).filter(AttendanceRecord.student_id == id).delete()
    db.delete(student)
    
    # Delete user record
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        db.delete(user)
        
    db.commit()
    return {"message": "Student deleted successfully"}

@router.delete("/teachers/{id}")
def delete_teacher(id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admin allowed")
    
    teacher = db.query(Teacher).filter(Teacher.id == id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    
    user_id = teacher.user_id
    db.delete(teacher)
    
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        db.delete(user)
        
    db.commit()
    return {"message": "Teacher deleted successfully"}

