-- Seed threaded comments on advice posts (run after 002 seed + 003 category + 004 threading)

INSERT INTO comments (id, user_id, post_id, parent_id, content, like_count, created_at)
VALUES
    (
        '50000000-0000-4000-8000-000000000001',
        '00000000-0000-4000-8000-000000000003',
        '10000000-0000-4000-8000-000000000004',
        NULL,
        'The bracing cue fixed my lower back rounding — game changer.',
        89,
        NOW() - INTERVAL '1 hour'
    ),
    (
        '50000000-0000-4000-8000-000000000002',
        '00000000-0000-4000-8000-000000000002',
        '10000000-0000-4000-8000-000000000004',
        NULL,
        'Should the bar touch shins at setup or stay an inch out?',
        34,
        NOW() - INTERVAL '45 minutes'
    ),
    (
        '50000000-0000-4000-8000-000000000003',
        '00000000-0000-4000-8000-000000000001',
        '10000000-0000-4000-8000-000000000004',
        '50000000-0000-4000-8000-000000000002',
        'Light contact at the shin — drag the bar up your legs on the way up.',
        21,
        NOW() - INTERVAL '30 minutes'
    ),
    (
        '50000000-0000-4000-8000-000000000004',
        '00000000-0000-4000-8000-000000000002',
        '10000000-0000-4000-8000-000000000008',
        NULL,
        'Depth check: hip crease below knee cap. Film from the side.',
        124,
        NOW() - INTERVAL '2 hours'
    ),
    (
        '50000000-0000-4000-8000-000000000005',
        '00000000-0000-4000-8000-000000000001',
        '10000000-0000-4000-8000-000000000008',
        NULL,
        'Adding a pause at the bottom helped me stay consistent.',
        67,
        NOW() - INTERVAL '1 hour'
    ),
    (
        '50000000-0000-4000-8000-000000000006',
        '00000000-0000-4000-8000-000000000002',
        '10000000-0000-4000-8000-000000000009',
        NULL,
        '7–9 hrs sleep made more difference than any supplement stack.',
        201,
        NOW() - INTERVAL '3 hours'
    )
ON CONFLICT (id) DO NOTHING;

UPDATE posts SET comment_count = sub.cnt
FROM (
    SELECT post_id, COUNT(*) AS cnt FROM comments GROUP BY post_id
) sub
WHERE posts.id = sub.post_id;
