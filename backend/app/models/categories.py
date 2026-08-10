from enum import Enum


class PostCategory(str, Enum):
    MAIN_FEED = "main_feed"
    MEAL_PREP = "meal_prep"
    NUTRITION = "nutrition"
    ADVICE = "advice"
    PRS = "prs"


CATEGORY_LABELS: dict[PostCategory, str] = {
    PostCategory.MAIN_FEED: "Main Feed",
    PostCategory.MEAL_PREP: "Meal Prep",
    PostCategory.NUTRITION: "Nutrition",
    PostCategory.ADVICE: "Advice",
    PostCategory.PRS: "PRs",
}

# Uploadable categories (Main Feed is a feed view, not a post label)
UPLOAD_CATEGORIES = [
    PostCategory.MEAL_PREP,
    PostCategory.NUTRITION,
    PostCategory.ADVICE,
    PostCategory.PRS,
]
