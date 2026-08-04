"""Content moderation scoring."""

import logging

import numpy as np

logger = logging.getLogger(__name__)

MODERATION_CATEGORIES = [
    "explicit_content", "violence_gore", "nudity",
    "hate_harassment", "unsafe_activity",
]


def moderate_frame(frame: np.ndarray, threshold: float = 0.7) -> list[dict]:
    """
    Score a frame for content moderation.
    In production, this calls AWS Rekognition, Google Vision, or a custom model.
    Returns list of {category, score} dicts.
    """
    # Mock implementation — replace with real moderation API
    scores = []
    for category in MODERATION_CATEGORIES:
        score = _mock_score(frame, category)
        if score > 0.1:
            scores.append({"category": category, "score": score})
    return scores


def _mock_score(frame: np.ndarray, category: str) -> float:
    """Deterministic mock based on frame hash for consistent testing."""
    h = hash(frame.tobytes()[:1000]) % 1000
    base = (h % 100) / 1000.0
    if category == "unsafe_activity":
        base *= 0.5
    return round(base, 3)


def aggregate_moderation_scores(frame_scores: list[list[dict]]) -> list[dict]:
    """Take max score per category across all frames."""
    max_scores: dict[str, float] = {}
    for scores in frame_scores:
        for s in scores:
            cat = s["category"]
            max_scores[cat] = max(max_scores.get(cat, 0), s["score"])
    return [{"category": k, "score": v} for k, v in max_scores.items()]
