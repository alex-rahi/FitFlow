import {
  PLACEHOLDER_AUDIT_LOG,
  PLACEHOLDER_REVIEW_QUEUE,
  PLACEHOLDER_STATS,
  USE_PLACEHOLDERS,
} from './placeholders';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';
const ADMIN_SECRET = process.env.ADMIN_SECRET ?? 'placeholder-admin-secret';

async function adminFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}/api/v1/admin${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Secret': ADMIN_SECRET,
      ...(options.headers as Record<string, string>),
    },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  if (res.status === 204) return undefined as T;
  return res.json();
}

export interface ReviewItem {
  id: string;
  post_id: string;
  priority: number;
  review_status: string;
  post: {
    id: string;
    caption: string | null;
    thumbnail_url: string | null;
    status: string;
    author: { username: string; display_name: string | null } | null;
  } | null;
  detections: Array<{ label: string; confidence: number; bounding_box: object }>;
  moderation_scores: Array<{ category: string; score: number }>;
  created_at: string;
}

export interface ModerationStats {
  total_posts: number;
  pending_review: number;
  approved: number;
  rejected: number;
  flagged: number;
  avg_processing_time_seconds: number | null;
}

export const adminApi = {
  getReviewQueue: async () => {
    if (USE_PLACEHOLDERS) return PLACEHOLDER_REVIEW_QUEUE as ReviewItem[];
    try {
      return await adminFetch<ReviewItem[]>('/review-queue');
    } catch {
      return PLACEHOLDER_REVIEW_QUEUE as ReviewItem[];
    }
  },
  submitReview: async (reviewId: string, action: string, notes?: string) => {
    if (USE_PLACEHOLDERS) return;
    return adminFetch<void>(`/review/${reviewId}`, {
      method: 'POST',
      body: JSON.stringify({ action, notes }),
    });
  },
  getStats: async () => {
    if (USE_PLACEHOLDERS) return PLACEHOLDER_STATS;
    try {
      return await adminFetch<ModerationStats>('/stats');
    } catch {
      return PLACEHOLDER_STATS;
    }
  },
  getAuditLog: async () => {
    if (USE_PLACEHOLDERS) return PLACEHOLDER_AUDIT_LOG;
    try {
      return await adminFetch<Array<{ id: string; action: string; resource_type: string; created_at: string; details: object }>>('/audit-log');
    } catch {
      return PLACEHOLDER_AUDIT_LOG;
    }
  },
};
