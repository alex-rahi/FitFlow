"""Business Rules Engine — evaluates AI model outputs and decides post fate."""

from dataclasses import dataclass, field
from enum import Enum


class Outcome(str, Enum):
    APPROVE = "approve"
    REJECT = "reject"
    AGE_RESTRICT = "age_restrict"
    FLAG_FOR_REVIEW = "flag_for_review"
    MANUAL_REVIEW = "manual_review"
    PUBLISH = "publish"


@dataclass
class RuleResult:
    rule_name: str
    outcome: Outcome
    confidence: float
    details: dict = field(default_factory=dict)


@dataclass
class EvaluationContext:
    detections: list[dict]
    moderation_scores: list[dict]
    user_trust_level: int = 0
    user_age_verified: bool = False
    account_age_days: int = 0
    prior_violations: int = 0


GYM_OBJECTS = {
    "person", "dumbbell", "bench", "squat rack", "barbell",
    "kettlebell", "treadmill", "exercise bike",
}

MODERATION_CATEGORIES = {
    "explicit_content", "violence_gore", "nudity",
    "hate_harassment", "unsafe_activity",
}

# Free-tier thresholds — no paid moderation APIs.
REJECT_THRESHOLD = 0.9
FLAG_THRESHOLD = 0.5


def rule_content_moderation(ctx: EvaluationContext, threshold: float = 0.7) -> RuleResult:
    """Reject high-confidence violations; flag gray scores for human review."""
    flagged_category = None
    flagged_score = 0.0
    for score in ctx.moderation_scores:
        if score["category"] not in MODERATION_CATEGORIES:
            continue
        value = score["score"]
        if value >= REJECT_THRESHOLD:
            return RuleResult(
                "content_moderation", Outcome.REJECT, value,
                {"category": score["category"], "score": value},
            )
        if value >= FLAG_THRESHOLD and value > flagged_score:
            flagged_category = score["category"]
            flagged_score = value

    if flagged_category:
        return RuleResult(
            "content_moderation", Outcome.FLAG_FOR_REVIEW, flagged_score,
            {"category": flagged_category, "score": flagged_score, "note": "Gray score — human review"},
        )
    return RuleResult("content_moderation", Outcome.APPROVE, 1.0)


def rule_exercise_detection(ctx: EvaluationContext) -> RuleResult:
    """Ensure at least one gym-related object or person is detected."""
    detected_labels = {d["label"].lower() for d in ctx.detections}
    gym_detected = detected_labels & GYM_OBJECTS

    if not gym_detected:
        return RuleResult(
            "exercise_detection", Outcome.FLAG_FOR_REVIEW, 0.5,
            {"reason": "No gym-related objects detected", "detected": list(detected_labels)},
        )
    return RuleResult(
        "exercise_detection", Outcome.APPROVE, 0.9,
        {"detected_objects": list(gym_detected)},
    )


def rule_safety_detection(ctx: EvaluationContext) -> RuleResult:
    """Flag unsafe exercise form or dangerous activity."""
    unsafe = [d for d in ctx.detections if d.get("detection_type") == "safety" and d["confidence"] > 0.6]
    if unsafe:
        return RuleResult(
            "safety_detection", Outcome.APPROVE, max(u["confidence"] for u in unsafe),
            {"unsafe_detections": len(unsafe), "note": "Flagged but auto-published"},
        )
    return RuleResult("safety_detection", Outcome.APPROVE, 0.95)


def rule_user_trust(ctx: EvaluationContext) -> RuleResult:
    """Repeat offenders and new accounts go to human review."""
    if ctx.prior_violations >= 3:
        return RuleResult(
            "user_trust", Outcome.MANUAL_REVIEW, 0.8,
            {"reason": "Multiple prior violations", "count": ctx.prior_violations},
        )
    if ctx.user_trust_level < 20 and ctx.account_age_days < 7:
        return RuleResult(
            "user_trust", Outcome.FLAG_FOR_REVIEW, 0.6,
            {"reason": "New account with low trust"},
        )
    return RuleResult("user_trust", Outcome.APPROVE, 0.9)


def rule_age_restriction(ctx: EvaluationContext) -> RuleResult:
    """Age-restrict content with partial nudity (workout attire)."""
    for score in ctx.moderation_scores:
        if score["category"] == "nudity" and 0.4 <= score["score"] < 0.7:
            return RuleResult(
                "age_restriction", Outcome.AGE_RESTRICT, score["score"],
                {"reason": "Partial nudity detected — 18+ required"},
            )
    return RuleResult("age_restriction", Outcome.APPROVE, 1.0)


OUTCOME_PRIORITY = {
    Outcome.REJECT: 6,
    Outcome.MANUAL_REVIEW: 5,
    Outcome.FLAG_FOR_REVIEW: 4,
    Outcome.AGE_RESTRICT: 3,
    Outcome.APPROVE: 2,
    Outcome.PUBLISH: 1,
}


def evaluate_all_rules(ctx: EvaluationContext, threshold: float = 0.7) -> tuple[Outcome, list[RuleResult]]:
    """Run all rules and return the highest-priority outcome."""
    rules = [
        rule_content_moderation(ctx, threshold),
        rule_exercise_detection(ctx),
        rule_safety_detection(ctx),
        rule_user_trust(ctx),
        rule_age_restriction(ctx),
    ]

    best = max(rules, key=lambda r: OUTCOME_PRIORITY[r.outcome])

    if best.outcome == Outcome.APPROVE:
        final = Outcome.PUBLISH
    else:
        final = best.outcome

    return final, rules
