export type FeedCategoryId = 'main_feed' | 'meal_prep' | 'nutrition' | 'advice' | 'prs';

export type UploadCategoryId = Exclude<FeedCategoryId, 'main_feed'>;

export type FeedLayoutType = 'scroll' | 'grid' | 'columns' | 'thread';

export interface FeedCategory {
  id: FeedCategoryId;
  label: string;
  description: string;
  layout: FeedLayoutType;
}

export const FEED_CATEGORIES: FeedCategory[] = [
  { id: 'main_feed', label: 'Main Feed', description: 'All videos from people you follow', layout: 'scroll' },
  { id: 'meal_prep', label: 'Meal Prep', description: 'Batch cooking and weekly prep routines', layout: 'scroll' },
  { id: 'nutrition', label: 'Nutrition', description: 'Macros, meals, and fueling strategies', layout: 'columns' },
  { id: 'advice', label: 'Advice', description: 'Community threads, form checks, and coaching', layout: 'thread' },
  { id: 'prs', label: 'PRs', description: 'Personal records and milestone lifts', layout: 'scroll' },
];

export const UPLOAD_CATEGORIES = FEED_CATEGORIES.filter((c) => c.id !== 'main_feed');

export function getCategoryLabel(id?: string | null): string | null {
  return FEED_CATEGORIES.find((c) => c.id === id)?.label ?? null;
}

export function getCategoryLayout(id: FeedCategoryId): FeedLayoutType {
  return FEED_CATEGORIES.find((c) => c.id === id)?.layout ?? 'scroll';
}
