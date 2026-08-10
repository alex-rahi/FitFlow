-- Add video categories: Main Feed, Meal Prep, Nutrition, Advice, PRs

CREATE TYPE post_category AS ENUM (
    'main_feed',
    'meal_prep',
    'nutrition',
    'advice',
    'prs'
);

ALTER TABLE posts
    ADD COLUMN category post_category NOT NULL DEFAULT 'meal_prep';

CREATE INDEX idx_posts_category ON posts(category);
CREATE INDEX idx_posts_category_status_created ON posts(category, status, created_at DESC);

COMMENT ON COLUMN posts.category IS 'Feed category: meal_prep, nutrition, advice, prs (main_feed is a view, not stored)';
