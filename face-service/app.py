import hmac
import logging
import os
import re
from threading import Lock
import time
import uuid

from fastapi import FastAPI, UploadFile, File, HTTPException, Form, Header, Depends, Request
from pydantic import BaseModel
from starlette.concurrency import run_in_threadpool
import cv2
import numpy as np

from services.face_detector import FaceDetector
from services.face_recognizer import FaceRecognizer

logger = logging.getLogger("face-service")
inference_lock = Lock()


def safe_error_detail(error):
    detail = str(error)
    detail = re.sub(
        r"(?i)(token|secret|password|authorization)\s*[:=]\s*[^\s,;]+",
        r"\1=[redacted]",
        detail
    )
    return detail[:240]


def detect_faces_serially(image):
    # Keep the shared InsightFace model instance serialized across requests.
    with inference_lock:
        return detector.detect_faces(image)

app = FastAPI(
    title="Face Attendance AI Service",
    version="1.0.0"
)


@app.middleware("http")
async def log_face_request(request: Request, call_next):
    if request.url.path not in ("/enroll", "/recognize"):
        return await call_next(request)

    supplied_id = request.headers.get("x-request-id", "")
    request_id = supplied_id if re.fullmatch(r"[0-9a-fA-F-]{36}", supplied_id) else str(uuid.uuid4())
    request.state.request_id = request_id
    started_at = time.perf_counter()
    logger.info(
        "Face request received request_id=%s method=%s path=%s",
        request_id,
        request.method,
        request.url.path
    )

    try:
        response = await call_next(request)
    except Exception as error:
        logger.error(
            "Face request raised request_id=%s elapsed_ms=%d error_type=%s error_detail=%s",
            request_id,
            round((time.perf_counter() - started_at) * 1000),
            type(error).__name__,
            safe_error_detail(error)
        )
        raise

    response.headers["X-Request-ID"] = request_id
    logger.info(
        "Face request completed request_id=%s status=%d elapsed_ms=%d",
        request_id,
        response.status_code,
        round((time.perf_counter() - started_at) * 1000)
    )
    return response


def require_backend_token(x_face_service_token: str | None = Header(default=None)):
    expected_token = os.environ.get("FACE_SERVICE_TOKEN")
    if not expected_token:
        raise HTTPException(
            status_code=503,
            detail="Face service authentication is not configured."
        )
    if not x_face_service_token or not hmac.compare_digest(
        x_face_service_token,
        expected_token
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid face service credentials."
        )


# Load AI models once when the service starts
detector = FaceDetector()
recognizer = FaceRecognizer()


class StudentEmbedding(BaseModel):
    studentId: str
    embedding: list[float]


class RecognitionRequest(BaseModel):
    students: list[StudentEmbedding]


@app.get("/health")
def health_check():
    return {
        "status": "success",
        "message": "Face Recognition Service is running"
    }


@app.post("/enroll", dependencies=[Depends(require_backend_token)])
async def enroll_face(request: Request, file: UploadFile = File(...)):
    request_id = request.state.request_id
    started_at = time.perf_counter()
    logger.info("Face enrollment processing started request_id=%s", request_id)

    # Read uploaded image
    image_bytes = await file.read()

    if not image_bytes:
        raise HTTPException(
            status_code=400,
            detail="Image file is empty."
        )

    # Convert image bytes to NumPy array
    image_array = np.frombuffer(
        image_bytes,
        dtype=np.uint8
    )

    # Convert NumPy array to OpenCV image
    image = cv2.imdecode(
        image_array,
        cv2.IMREAD_COLOR
    )

    if image is None:
        raise HTTPException(
            status_code=400,
            detail="Invalid image file."
        )

    # Detect faces
    inference_started_at = time.perf_counter()
    logger.info("InsightFace inference started request_id=%s", request_id)
    try:
        faces = await run_in_threadpool(detect_faces_serially, image)
    except Exception as error:
        logger.error(
            "InsightFace inference failed request_id=%s elapsed_ms=%d error_type=%s error_detail=%s",
            request_id,
            round((time.perf_counter() - inference_started_at) * 1000),
            type(error).__name__,
            safe_error_detail(error)
        )
        raise HTTPException(
            status_code=500,
            detail="Face detection failed. Please try again with a clear photo."
        ) from error

    inference_elapsed_ms = round((time.perf_counter() - inference_started_at) * 1000)
    logger.info(
        "InsightFace inference completed request_id=%s elapsed_ms=%d face_count=%d",
        request_id,
        inference_elapsed_ms,
        len(faces)
    )

    # No face
    if len(faces) == 0:
        raise HTTPException(
            status_code=400,
            detail="No face detected in the image."
        )

    # More than one face
    if len(faces) > 1:
        raise HTTPException(
            status_code=400,
            detail=(
                "Multiple faces detected. "
                "Please upload a photo containing only one face."
            )
        )

    # Get 512-dimensional embedding
    embedding = faces[0].embedding

    logger.info(
        "Face enrollment processing completed request_id=%s elapsed_ms=%d embedding_length=%d",
        request_id,
        round((time.perf_counter() - started_at) * 1000),
        len(embedding)
    )

    return {
        "status": "success",
        "message": "Face enrolled successfully.",
        "embedding": embedding.tolist()
    }


@app.post("/recognize", dependencies=[Depends(require_backend_token)])
async def recognize_faces(
    file: UploadFile = File(...),
    students_json: str = Form(..., description="JSON string of enrolled students with their embeddings")
):

    # Validate image
    image_bytes = await file.read()

    if not image_bytes:
        raise HTTPException(
            status_code=400,
            detail="Image file is empty."
        )

    # Convert image bytes to NumPy array
    image_array = np.frombuffer(
        image_bytes,
        dtype=np.uint8
    )

    # Convert to OpenCV image
    image = cv2.imdecode(
        image_array,
        cv2.IMREAD_COLOR
    )

    if image is None:
        raise HTTPException(
            status_code=400,
            detail="Invalid image file."
        )

    # Parse enrolled students
    import json

    try:
        students_data = json.loads(students_json)
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=400,
            detail="Invalid students data."
        )

    if not students_data:
        raise HTTPException(
            status_code=400,
            detail="No enrolled student embeddings provided."
        )

    # Detect faces in group photo
    faces = await run_in_threadpool(detect_faces_serially, image)

    if len(faces) == 0:
        return {
            "status": "success",
            "message": "No faces detected.",
            "matches": []
        }

    matches = []

    # Compare every detected face
    for face_index, face in enumerate(faces):

        detected_embedding = face.embedding

        best_match = None
        best_similarity = -1.0

        for student in students_data:

            student_id = student.get("studentId")
            enrolled_embedding = student.get("embedding")

            if not student_id or not enrolled_embedding:
                continue

            is_match, similarity = recognizer.is_match(
                detected_embedding,
                enrolled_embedding
            )

            if similarity > best_similarity:
                best_similarity = similarity
                best_match = {
                    "studentId": student_id,
                    "similarity": similarity,
                    "match": is_match
                }

        # Add only if a student was compared
        if best_match:
            matches.append({
                "faceIndex": face_index,
                "studentId": best_match["studentId"],
                "similarity": best_match["similarity"],
                "match": best_match["match"]
            })

    return {
        "status": "success",
        "message": "Face recognition completed.",
        "facesDetected": len(faces),
        "matches": matches
    }
