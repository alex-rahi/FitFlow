/** Rank main-feed posts using engagement metadata and recency decay. */

export interface RankablePost {
  like_count?: number;
  comment_count?: number;
  view_count?: number;
  created_at?: string;
}

export function engagementScore(post: RankablePost): number {
  const likes = post.like_count ?? 0;
  const comments = post.comment_count ?? 0;
  const views = post.view_count ?? 0;
  const createdAt = post.created_at ? new Date(post.created_at).getTime() : Date.now();
  const ageHours = Math.max(0, (Date.now() - createdAt) / 3600000);
  const recencyDecay = 1 / (1 + ageHours / 48);
  return (likes * 3 + comments * 5 + views * 0.1) * recencyDecay;
}

export function rankPostsByEngagement<T extends RankablePost>(posts: T[]): T[] {
  return [...posts].sort((a, b) => engagementScore(b) - engagementScore(a));
}
