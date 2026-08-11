"""Map rules-engine outcomes to post status and review behavior."""

from app.rules.engine import Outcome

POST_STATUS_BY_OUTCOME: dict[Outcome, str] = {
    Outcome.PUBLISH: "published",
    Outcome.APPROVE: "published",
    Outcome.REJECT: "rejected",
    Outcome.AGE_RESTRICT: "age_restricted",
    Outcome.FLAG_FOR_REVIEW: "pending_review",
    Outcome.MANUAL_REVIEW: "pending_review",
}


def post_status_for_outcome(outcome: Outcome) -> str:
    return POST_STATUS_BY_OUTCOME.get(outcome, "pending_review")


def needs_human_review(outcome: Outcome) -> bool:
    return outcome in (Outcome.FLAG_FOR_REVIEW, Outcome.MANUAL_REVIEW)


def review_priority(outcome: Outcome) -> int:
    if outcome == Outcome.MANUAL_REVIEW:
        return 10
    if outcome == Outcome.FLAG_FOR_REVIEW:
        return 5
    return 0
