"""Run YOLO + moderation + rules on a local image or video file."""

from __future__ import annotations

import os
import tempfile
from dataclasses import dataclass

import cv2
import numpy as np

from app.config import settings
from app.pipeline.frame_extractor import extract_frames, get_video_duration
from app.pipeline.moderation import aggregate_moderation_scores, moderate_frame
from app.pipeline.yolo_detector import detect_objects
from app.rules.engine import EvaluationContext, Outcome, evaluate_all_rules


@dataclass
class AnalysisResult:
    detections: list[dict]
    moderation_scores: list[dict]
    outcome: str
    rules: list[dict]
    duration_seconds: float | None = None


def _is_video(path: str) -> bool:
    ext = os.path.splitext(path)[1].lower()
    return ext in {".mp4", ".mov", ".webm", ".mkv", ".avi", ".m4v"}


def analyze_path(path: str, moderation_threshold: float | None = None) -> AnalysisResult:
    threshold = moderation_threshold if moderation_threshold is not None else settings.moderation_threshold
    all_detections: list[dict] = []
    frame_mod_scores: list[list[dict]] = []
    duration: float | None = None

    if _is_video(path):
        duration = get_video_duration(path)
        for timestamp, frame in extract_frames(path, settings.frame_extract_interval):
            dets = detect_objects(frame, settings.yolo_model_path)
            for det in dets:
                det["frame_timestamp"] = timestamp
            all_detections.extend(dets)
            frame_mod_scores.append(moderate_frame(frame, threshold))
    else:
        frame = cv2.imread(path)
        if frame is None:
            raise ValueError(f"Could not read image: {path}")
        all_detections = detect_objects(frame, settings.yolo_model_path)
        frame_mod_scores.append(moderate_frame(frame, threshold))

    mod_scores = aggregate_moderation_scores(frame_mod_scores) if frame_mod_scores else []
    ctx = EvaluationContext(
        detections=all_detections,
        moderation_scores=mod_scores,
        user_trust_level=50,
        user_age_verified=True,
        prior_violations=0,
    )
    final_outcome, rule_results = evaluate_all_rules(ctx, threshold)

    status_map = {
        Outcome.PUBLISH: "published",
        Outcome.APPROVE: "published",
        Outcome.REJECT: "rejected",
        Outcome.AGE_RESTRICT: "age_restricted",
        Outcome.FLAG_FOR_REVIEW: "published",
        Outcome.MANUAL_REVIEW: "published",
    }

    return AnalysisResult(
        detections=all_detections,
        moderation_scores=mod_scores,
        outcome=status_map.get(final_outcome, "published"),
        rules=[
            {
                "rule_name": rr.rule_name,
                "outcome": rr.outcome.value,
                "confidence": rr.confidence,
                "details": rr.details,
            }
            for rr in rule_results
        ],
        duration_seconds=duration,
    )


def analyze_bytes(data: bytes, suffix: str, moderation_threshold: float | None = None) -> AnalysisResult:
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(data)
        tmp_path = tmp.name
    try:
        return analyze_path(tmp_path, moderation_threshold)
    finally:
        os.unlink(tmp_path)
