from collections import defaultdict
import cv2
import ast
import time
import requests
import argparse
import sys

from app.services.face_service import get_face_embedding, compare_faces
from app.database.connection import SessionLocal
from app.models.face_embedding import FaceEmbedding
from app.models.attendance_session import AttendanceSession

# Set up argument parsing
parser = argparse.ArgumentParser(description='AI Attendance Camera Script')
parser.add_argument('--session_id', type=int, required=True, help='Current attendance session ID')
parser.add_argument('--camera', type=int, default=0, help='Camera index (default: 0)')
parser.add_argument('--api', type=str, default="http://127.0.0.1:8000/attendance/mark", help='API endpoint')
args = parser.parse_args()

SESSION_ID = args.session_id
CAMERA_INDEX = args.camera
API_URL = args.api
SCAN_DELAY = 1
CONFIRM_FRAMES = 3

print(f"--- Starting AI Attendance Camera ---")
print(f"Session ID: {SESSION_ID}")
print(f"Camera Index: {CAMERA_INDEX}")

try:
    db = SessionLocal()
    embeddings = db.query(FaceEmbedding).all()

    known = []
    for e in embeddings:
        if e.embedding:
            try:
                known.append((e.student_id, ast.literal_eval(e.embedding)))
            except Exception as err:
                print(f"Skipping invalid embedding for student {e.student_id}: {err}")

    db.close()
except Exception as e:
    print(f"❌ Database Error: {e}")
    sys.exit(1)

print("Loaded embeddings:", len(known))

cap = cv2.VideoCapture(CAMERA_INDEX)
if not cap.isOpened():
    print(f"❌ Camera {CAMERA_INDEX} not opened")
    sys.exit(1)

print("✅ Camera started. Press Q to quit.")

frame_count = defaultdict(int)
marked_students = set()
last_status_check = 0

while True:
    # Check session status every 10 seconds
    if time.time() - last_status_check > 10:
        try:
            check_db = SessionLocal()
            session = check_db.query(AttendanceSession).filter(AttendanceSession.id == SESSION_ID).first()
            if not session or session.status == 'completed':
                print(f"Session {SESSION_ID} is completed or missing. Stopping camera...")
                check_db.close()
                break
            check_db.close()
            last_status_check = time.time()
        except Exception as e:
            print(f"Status check failed: {e}")

    ret, frame = cap.read()
    if not ret:
        print("❌ Failed to read frame")
        break

    # Add visual indicators to the frame
    cv2.putText(frame, f"Session: {SESSION_ID}", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
    cv2.imshow("AI Attendance Camera", frame)

    success, buffer = cv2.imencode(".jpg", frame)
    if not success:
        continue

    image_bytes = buffer.tobytes()
    embedding = get_face_embedding(image_bytes)

    if embedding is not None:
        student_id = compare_faces(known, embedding)

        if student_id:
            frame_count[student_id] += 1
            print(f"Detected Student {student_id} | Count: {frame_count[student_id]}")

            if frame_count[student_id] >= CONFIRM_FRAMES and student_id not in marked_students:
                print(f"🎯 Confirmed Student {student_id}. Marking attendance...")

                try:
                    response = requests.post(
                        API_URL,
                        files={"file": ("image.jpg", image_bytes, "image/jpeg")},
                        data={"session_id": str(SESSION_ID)},
                        timeout=5
                    )

                    if response.status_code == 200:
                        print(f"✅ Marked Present: Student {student_id}")
                        marked_students.add(student_id)
                    else:
                        print(f"⚠️ API Error ({response.status_code}): {response.text}")

                except Exception as e:
                    print(f"❌ API Request Failed: {e}")

                time.sleep(SCAN_DELAY)

    if cv2.waitKey(1) & 0xFF == ord("q"):
        break

cap.release()
cv2.destroyAllWindows()
print("Camera stopped")
