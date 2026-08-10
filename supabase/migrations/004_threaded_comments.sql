-- Threaded community comments for Advice feed

ALTER TABLE comments
    ADD COLUMN parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    ADD COLUMN like_count INT NOT NULL DEFAULT 0;

CREATE INDEX idx_comments_post_parent ON comments(post_id, parent_id, created_at ASC);

-- Keep post.comment_count in sync
CREATE OR REPLACE FUNCTION sync_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE posts SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = OLD.post_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_comments_count ON comments;
CREATE TRIGGER trg_comments_count
    AFTER INSERT OR DELETE ON comments
    FOR EACH ROW EXECUTE FUNCTION sync_post_comment_count();

COMMENT ON COLUMN comments.parent_id IS 'NULL = direct reply to thread OP (post); set for nested replies';
