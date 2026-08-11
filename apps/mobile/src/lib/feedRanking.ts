/** Rank main-feed posts using engagement metadata, recency decay, and user interests. */

import { getPostTopics, getTopicLabel, ContentTopic } from './contentTopics';
import { InterestScores } from './userInterests';

export interface RankablePost {
  like_count?: number;
  comment_count?: number;
  view_count?: number;
  created_at?: string;
  category?: string | null;
  caption?: string | null;
  topics?: string[] | null;
  media_type?: string | null;
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

export function interestBoost(post: RankablePost, scores: InterestScores): number {
  const topics = getPostTopics(post);
  let affinity = 0;
  for (const topic of topics) {
    affinity += scores[topic] ?? 0;
  }
  if (affinity <= 0) return 1;
  return 1 + Math.min(affinity * 0.018, 1.35);
}

export function personalizedScore(post: RankablePost, scores: InterestScores): number {
  return engagementScore(post) * interestBoost(post, scores);
}

export function rankPostsByEngagement<T extends RankablePost>(posts: T[]): T[] {
  return [...posts].sort((a, b) => engagementScore(b) - engagementScore(a));
}

export function rankPostsForUser<T extends RankablePost>(posts: T[], scores: InterestScores): T[] {
  if (Object.keys(scores).length === 0) return rankPostsByEngagement(posts);
  return [...posts].sort((a, b) => personalizedScore(b, scores) - personalizedScore(a, scores));
}

/** Best-matching topic for a post given current user affinities (for UI hints). */
export function getMatchingInterest(
  post: RankablePost,
  scores: InterestScores,
): { topic: string; label: string } | null {
  const topics = getPostTopics(post);
  let best: { topic: string; score: number } | null = null;
  for (const topic of topics) {
    const s = scores[topic] ?? 0;
    if (s > 1 && (!best || s > best.score)) best = { topic, score: s };
  }
  if (!best) return null;
  return { topic: best.topic, label: getTopicLabel(best.topic as ContentTopic) };
}
