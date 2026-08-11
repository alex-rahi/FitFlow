export type PostCategoryId = 'meal_prep' | 'nutrition' | 'advice' | 'prs';

export type FeedViewId = 'feed' | 'recipes' | 'community';

export type ApiFeedCategory = PostCategoryId | 'main_feed';

export type UploadCategoryId = PostCategoryId;

export type FeedLayoutType = 'scroll' | 'grid' | 'thread';

export interface PostCategory {
  id: PostCategoryId;
  label: string;
  description: string;
}

export interface FeedView {
  id: FeedViewId;
  label: string;
  description: string;
  layout: FeedLayoutType;
}

export const POST_CATEGORIES: PostCategory[] = [
  { id: 'meal_prep', label: 'Meal Prep', description: 'Batch cooking and weekly prep routines' },
  { id: 'nutrition', label: 'Nutrition', description: 'Macros, meals, and fueling strategies' },
  { id: 'advice', label: 'Advice', description: 'Form checks, coaching, and Q&A' },
  { id: 'prs', label: 'PRs', description: 'Personal records and milestone lifts' },
];

export const FEED_VIEWS: FeedView[] = [
  { id: 'feed', label: 'Feed', description: 'Workout videos and PRs', layout: 'scroll' },
  { id: 'recipes', label: 'Recipes', description: 'Meal prep and nutrition', layout: 'grid' },
  { id: 'community', label: 'Community', description: 'Threads and coaching', layout: 'thread' },
];

export const UPLOAD_CATEGORIES = POST_CATEGORIES;

export const RECIPE_CATEGORIES: PostCategoryId[] = ['meal_prep', 'nutrition'];

const MAIN_FEED_EXCLUDED: PostCategoryId[] = ['meal_prep', 'nutrition', 'advice'];

export function getCategoryLabel(id?: string | null): string | null {
  return POST_CATEGORIES.find((c) => c.id === id)?.label ?? null;
}

export function getFeedViewLayout(id: FeedViewId): FeedLayoutType {
  return FEED_VIEWS.find((v) => v.id === id)?.layout ?? 'scroll';
}

export function filterPostsForFeedView<T extends { category?: string | null }>(
  posts: T[],
  view: FeedViewId,
): T[] {
  switch (view) {
    case 'feed':
      return posts.filter(
        (post) => !MAIN_FEED_EXCLUDED.includes(post.category as PostCategoryId),
      );
    case 'recipes':
      return posts.filter((post) => RECIPE_CATEGORIES.includes(post.category as PostCategoryId));
    case 'community':
      return posts.filter((post) => post.category === 'advice');
  }
}
