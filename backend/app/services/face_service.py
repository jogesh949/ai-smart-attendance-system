import cv2
import numpy as np
import logging
from insightface.app import FaceAnalysis

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# load model once - Use CPU (ctx_id=-1) to ensure it works on all systems
try:
    face_app = FaceAnalysis(name="buffalo_l", providers=['CPUExecutionProvider'])
    face_app.prepare(ctx_id=-1)
    logger.info("FaceAnalysis model loaded successfully on CPU")
except Exception as e:
    logger.error(f"Failed to load FaceAnalysis model: {e}")
    # Fallback to default if providers not supported
    face_app = FaceAnalysis(name="buffalo_l")
    face_app.prepare(ctx_id=-1)

def get_face_embedding(image_bytes):
    details = get_faces_with_details(image_bytes)
    if not details:
        return None
    return details[0]["embedding"]

def get_faces_with_details(image_bytes):
    try:
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            return []

        faces = face_app.get(img)

        results = []
        for face in faces:
            results.append({
                "bbox": face.bbox.tolist(), # [x1, y1, x2, y2]
                "det_score": float(face.det_score),
                "embedding": face.embedding.tolist()
            })
        return results
    except Exception as e:
        logger.error(f"Error in get_faces_with_details: {e}")
        return []

def compare_faces(known_embeddings, new_embedding, threshold=1.0):
    best_match = None
    min_dist = threshold

    for student_id, embedding in known_embeddings:
        dist = np.linalg.norm(np.array(embedding) - np.array(new_embedding))
        if dist < min_dist:
            min_dist = dist
            best_match = student_id

    if best_match:
        # Calculate a mock confidence based on distance
        confidence = max(0, 1 - (min_dist / threshold))
        return best_match, round(confidence * 100, 2)

    return None, 0