/** Content interest topics inferred from post metadata (category, caption, tags). */

export type ContentTopic =
  | 'workouts'
  | 'nutrition'
  | 'meal_prep'
  | 'equipment'
  | 'prs'
  | 'supplements'
  | 'recovery'
  | 'advice';

export const TOPIC_LABELS: Record<ContentTopic, string> = {
  workouts: 'Workouts',
  nutrition: 'Nutrition',
  meal_prep: 'Meal Prep',
  equipment: 'Equipment',
  prs: 'PRs',
  supplements: 'Supplements',
  recovery: 'Recovery',
  advice: 'Community',
};

const CAPTION_KEYWORDS: Record<ContentTopic, RegExp> = {
  meal_prep: /\b(meal prep|meal-prep|batch cook|prep day|food prep)\b/i,
  equipment: /\b(belt|rack|barbell|dumbbell|machine|bench|platform|straps|wraps|sleeves|bumper|kettlebell|smith)\b/i,
  supplements: /\b(creatine|protein powder|pre-?workout|supplement|bcaa|collagen|vitamin)\b/i,
  recovery: /\b(stretch|mobility|foam roll|recovery|sleep|deload|rest day|yoga)\b/i,
  workouts: /\b(squat|deadlift|bench|push day|pull day|leg day|hypertrophy|cardio|hiit|training)\b/i,
  nutrition: /\b(protein|macro|calorie|cut|bulk|diet|nutrition|carb|fat)\b/i,
  prs: /\b(\bpr\b|personal record|max attempt|1rm|new max|lifetime)\b/i,
  advice: /\b(tip|how do|best|recommend|should i|what's|advice)\b/i,
};

const CATEGORY_TOPICS: Partial<Record<string, ContentTopic[]>> = {
  workouts: ['workouts', 'equipment'],
  nutrition: ['nutrition', 'meal_prep'],
  prs: ['prs', 'workouts'],
  advice: ['advice'],
};

export interface TopicPost {
  category?: string | null;
  caption?: string | null;
  topics?: string[] | null;
  media_type?: string | null;
}

export function getPostTopics(post: TopicPost): ContentTopic[] {
  const explicit = (post.topics ?? [])
    .filter((t): t is ContentTopic => t in TOPIC_LABELS);
  if (explicit.length > 0) return [...new Set(explicit)];

  const fromCategory = CATEGORY_TOPICS[post.category ?? ''] ?? [];
  const fromCaption: ContentTopic[] = [];
  const text = post.caption ?? '';
  for (const [topic, pattern] of Object.entries(CAPTION_KEYWORDS) as [ContentTopic, RegExp][]) {
    if (pattern.test(text)) fromCaption.push(topic);
  }

  const merged = [...new Set([...fromCategory, ...fromCaption])];
  if (merged.length > 0) return merged;
  if (post.category && post.category in TOPIC_LABELS) return [post.category as ContentTopic];
  if (post.media_type === 'photo') return ['workouts'];
  return ['workouts'];
}

export function getTopicLabel(topic: ContentTopic): string {
  return TOPIC_LABELS[topic] ?? topic;
}

export function laneToTopics(laneId: string): ContentTopic[] {
  switch (laneId) {
    case 'workouts': return ['workouts', 'equipment'];
    case 'nutrition': return ['nutrition', 'meal_prep'];
    case 'prs': return ['prs'];
    case 'photos': return ['workouts', 'prs'];
    case 'community': return ['advice'];
    default: return [];
  }
}
