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

        # Resize image for 2x faster processing
        height, width = img.shape[:2]
        small_img = cv2.resize(img, (width // 2, height // 2))

        faces = face_app.get(small_img)

        results = []
        for face in faces:
            # Scale bbox back to original size
            scaled_bbox = face.bbox * 2
            # Normalize embedding for better comparison
            feat = face.embedding
            norm_feat = feat / np.linalg.norm(feat)
            
            results.append({
                "bbox": scaled_bbox.tolist(), # [x1, y1, x2, y2]
                "det_score": float(face.det_score),
                "embedding": norm_feat.tolist()
            })
        return results
    except Exception as e:
        logger.error(f"Error in get_faces_with_details: {e}")
        return []

import ast

def parse_embedding(embedding_str):
    """Safely parse embedding string from DB."""
    try:
        if not embedding_str:
            return None
        return ast.literal_eval(embedding_str)
    except Exception as e:
        logger.error(f"Error parsing embedding: {e}")
        return None

def compare_faces(known_embeddings, new_embedding, threshold=0.8):
    """
    Compare a new embedding against known embeddings.
    Threshold of 0.7 - 0.9 is strict for normalized L2 distance on InsightFace.
    0.8 is a safe, strict default.
    """
    if not known_embeddings or new_embedding is None:
        return None, 0

    best_match = None
    min_dist = threshold
    
    # Ensure new embedding is a numpy array and normalized
    new_embedding = np.array(new_embedding)
    new_norm = np.linalg.norm(new_embedding)
    if new_norm > 0:
        new_embedding = new_embedding / new_norm

    for student_id, embedding in known_embeddings:
        if embedding is None:
            continue
            
        # Ensure known embedding is normalized (in case old ones weren't)
        emb = np.array(embedding)
        emb_norm = np.linalg.norm(emb)
        if emb_norm > 0:
            emb = emb / emb_norm
            
        dist = np.linalg.norm(emb - new_embedding)
        if dist < min_dist:
            min_dist = dist
            best_match = student_id

    if best_match:
        # Calculate a mock confidence based on distance
        # For normalized L2, max dist is 2.0.
        confidence = max(0, 1 - (min_dist / 1.5)) # Using 1.5 as a scaling factor for confidence
        return best_match, round(confidence * 100, 2)

    return None, 0