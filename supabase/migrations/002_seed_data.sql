-- GymTok Seed Data — run after 001_initial_schema.sql
-- Creates placeholder users and published posts for local development

-- Placeholder profiles (IDs match mobile/backend placeholder constants)
INSERT INTO profiles (id, username, display_name, bio, trust_level, follower_count, following_count, post_count)
VALUES
  ('00000000-0000-4000-8000-000000000001', 'alex_lifts', 'Alex Lifts', 'Placeholder profile for local dev', 85, 1284, 312, 47),
  ('00000000-0000-4000-8000-000000000002', 'fitness_jade', 'Jade Fitness', 'Certified trainer · HIIT & strength', 92, 8420, 210, 156),
  ('00000000-0000-4000-8000-000000000003', 'bench_king', 'Bench King', 'Powerlifting · 405 bench goal', 78, 3200, 89, 72)
ON CONFLICT (id) DO NOTHING;

-- Published posts
INSERT INTO posts (id, user_id, caption, status, moderation_decision, like_count, comment_count, view_count, duration_seconds)
VALUES
  ('10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001',
   'Heavy deadlift PR — 405 lbs 💪 Form check welcome!', 'published', 'publish', 842, 56, 12400, 32.0),
  ('10000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000002',
   'Morning leg day — squats & lunges 🔥', 'published', 'publish', 1203, 89, 18700, 45.0),
  ('10000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000003',
   'Bench press 225x5 — slow & controlled reps', 'published', 'publish', 567, 34, 9200, 28.0)
ON CONFLICT (id) DO NOTHING;

-- Sample review queue item
INSERT INTO posts (id, user_id, caption, status, moderation_decision)
VALUES
  ('10000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-000000000001',
   'New PR attempt — needs manual review', 'pending_review', 'manual_review')
ON CONFLICT (id) DO NOTHING;

INSERT INTO review_queue (id, post_id, priority, review_status)
VALUES
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000004', 10, 'pending')
ON CONFLICT (id) DO NOTHING;

-- AI detections for review item
INSERT INTO ai_detections (post_id, frame_timestamp, detection_type, label, confidence, bounding_box)
VALUES
  ('10000000-0000-4000-8000-000000000004', 2.0, 'object', 'person', 0.94, '{"x1": 80, "y1": 40, "x2": 420, "y2": 580}'),
  ('10000000-0000-4000-8000-000000000004', 2.0, 'object', 'barbell', 0.71, '{"x1": 120, "y1": 280, "x2": 380, "y2": 320}');

INSERT INTO moderation_scores (post_id, category, score)
VALUES
  ('10000000-0000-4000-8000-000000000004', 'explicit_content', 0.04),
  ('10000000-0000-4000-8000-000000000004', 'unsafe_activity', 0.58);

-- Sample notifications
INSERT INTO notifications (id, user_id, type, title, body, data, read)
VALUES
  ('40000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001',
   'like', 'fitness_jade liked your video', 'Heavy deadlift PR — 405 lbs 💪',
   '{"post_id": "10000000-0000-4000-8000-000000000001"}', false),
  ('40000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000001',
   'follow', 'bench_king started following you', NULL,
   '{"user_id": "00000000-0000-4000-8000-000000000003"}', false)
ON CONFLICT (id) DO NOTHING;

-- Follow relationships
INSERT INTO follows (follower_id, following_id)
VALUES
  ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000002'),
  ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000003')
ON CONFLICT DO NOTHING;
