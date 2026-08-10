const USE_PLACEHOLDERS = process.env.NEXT_PUBLIC_USE_PLACEHOLDERS === 'true';

export const PLACEHOLDER_STATS = {
  total_posts: 1247,
  pending_review: 8,
  approved: 1102,
  rejected: 89,
  flagged: 48,
  avg_processing_time_seconds: 12.4,
};

export const PLACEHOLDER_REVIEW_QUEUE = [
  {
    id: '20000000-0000-4000-8000-000000000001',
    post_id: '10000000-0000-4000-8000-000000000004',
    priority: 10,
    review_status: 'pending',
    post: {
      id: '10000000-0000-4000-8000-000000000004',
      category: 'prs',
      caption: 'New PR attempt — needs manual review',
      thumbnail_url: null,
      status: 'pending_review',
      author: { username: 'new_lifter', display_name: 'New Lifter' },
    },
    detections: [
      { label: 'person', confidence: 0.94, bounding_box: { x1: 80, y1: 40, x2: 420, y2: 580 } },
      { label: 'barbell', confidence: 0.71, bounding_box: { x1: 120, y1: 280, x2: 380, y2: 320 } },
    ],
    moderation_scores: [
      { category: 'explicit_content', score: 0.04 },
      { category: 'violence_gore', score: 0.02 },
      { category: 'nudity', score: 0.12 },
      { category: 'unsafe_activity', score: 0.58 },
    ],
    created_at: '2025-07-30T14:00:00Z',
  },
  {
    id: '20000000-0000-4000-8000-000000000002',
    post_id: '10000000-0000-4000-8000-000000000005',
    priority: 5,
    review_status: 'pending',
    post: {
      id: '10000000-0000-4000-8000-000000000005',
      category: 'advice',
      caption: 'No gym equipment detected — flagged by AI',
      thumbnail_url: null,
      status: 'flagged',
      author: { username: 'casual_user', display_name: 'Casual User' },
    },
    detections: [{ label: 'person', confidence: 0.88, bounding_box: { x1: 100, y1: 50, x2: 400, y2: 600 } }],
    moderation_scores: [
      { category: 'explicit_content', score: 0.03 },
      { category: 'unsafe_activity', score: 0.22 },
    ],
    created_at: '2025-07-30T12:30:00Z',
  },
];

export const PLACEHOLDER_AUDIT_LOG = [
  {
    id: '30000000-0000-4000-8000-000000000001',
    action: 'auto_moderation',
    resource_type: 'post',
    created_at: '2025-07-30T14:05:00Z',
    details: { outcome: 'manual_review', rules_evaluated: 5 },
  },
  {
    id: '30000000-0000-4000-8000-000000000002',
    action: 'auto_moderation',
    resource_type: 'post',
    created_at: '2025-07-30T13:20:00Z',
    details: { outcome: 'publish', rules_evaluated: 5 },
  },
  {
    id: '30000000-0000-4000-8000-000000000003',
    action: 'manual_review',
    resource_type: 'post',
    created_at: '2025-07-30T11:00:00Z',
    details: { outcome: 'reject', notes: 'Unsafe form detected' },
  },
];

export { USE_PLACEHOLDERS };
