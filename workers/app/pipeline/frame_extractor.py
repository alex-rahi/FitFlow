"""Frame extraction from video files."""

import os
import tempfile

import cv2
import numpy as np


def extract_frames(video_path: str, interval_seconds: float = 2.0) -> list[tuple[float, np.ndarray]]:
    """Extract frames at regular intervals. Returns (timestamp, frame) pairs."""
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise ValueError(f"Cannot open video: {video_path}")

    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    frame_interval = int(fps * interval_seconds)
    frames: list[tuple[float, np.ndarray]] = []
    frame_idx = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            break
        if frame_idx % frame_interval == 0:
            timestamp = frame_idx / fps
            frames.append((timestamp, frame))
        frame_idx += 1

    cap.release()
    return frames


def generate_thumbnail(video_path: str, output_path: str, at_seconds: float = 1.0) -> str:
    """Extract a single frame as thumbnail."""
    cap = cv2.VideoCapture(video_path)
    cap.set(cv2.CAP_PROP_POS_MSEC, at_seconds * 1000)
    ret, frame = cap.read()
    cap.release()

    if ret:
        cv2.imwrite(output_path, frame)
        return output_path
    raise ValueError("Could not extract thumbnail frame")


def get_video_duration(video_path: str) -> float:
    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    frame_count = cap.get(cv2.CAP_PROP_FRAME_COUNT)
    cap.release()
    return frame_count / fps if fps > 0 else 0.0
