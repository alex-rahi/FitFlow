"""YOLO object detection for gym-related objects."""

import logging

import numpy as np

logger = logging.getLogger(__name__)

# Map COCO / model labels to gym taxonomy used by the rules engine.
LABEL_ALIASES: dict[str, str] = {
    "person": "person",
    "sports ball": "dumbbell",
    "baseball bat": "barbell",
    "tennis racket": "resistance band",
    "skateboard": "bench",
    "backpack": "equipment",
    "handbag": "equipment",
    "suitcase": "equipment",
    "bottle": "equipment",
    "cup": "equipment",
    "chair": "bench",
    "bench": "bench",
    "dumbbell": "dumbbell",
    "barbell": "barbell",
    "kettlebell": "kettlebell",
}


def normalize_label(label: str) -> str:
    key = label.lower().strip()
    return LABEL_ALIASES.get(key, key)


try:
    from ultralytics import YOLO
    _model = None

    def _get_model(model_path: str):
        global _model
        if _model is None:
            logger.info("Loading YOLO model from %s", model_path)
            _model = YOLO(model_path)
        return _model

    def detect_objects(frame: np.ndarray, model_path: str, confidence: float = 0.4) -> list[dict]:
        model = _get_model(model_path)
        results = model(frame, verbose=False)
        detections = []
        for result in results:
            for box in result.boxes:
                cls_id = int(box.cls[0])
                conf = float(box.conf[0])
                if conf < confidence:
                    continue
                raw_label = result.names.get(cls_id, f"class_{cls_id}")
                label = normalize_label(raw_label)
                xyxy = box.xyxy[0].tolist()
                detections.append({
                    "detection_type": "object",
                    "label": label,
                    "raw_label": raw_label,
                    "confidence": conf,
                    "bounding_box": {
                        "x1": xyxy[0], "y1": xyxy[1],
                        "x2": xyxy[2], "y2": xyxy[3],
                    },
                })
        return detections

except ImportError:
    logger.warning("ultralytics not available — using mock detections")

    def detect_objects(frame: np.ndarray, model_path: str, confidence: float = 0.4) -> list[dict]:
        return [
            {"detection_type": "object", "label": "person", "raw_label": "person", "confidence": 0.92,
             "bounding_box": {"x1": 100, "y1": 50, "x2": 400, "y2": 600}},
            {"detection_type": "object", "label": "dumbbell", "raw_label": "dumbbell", "confidence": 0.78,
             "bounding_box": {"x1": 200, "y1": 300, "x2": 350, "y2": 380}},
        ]
