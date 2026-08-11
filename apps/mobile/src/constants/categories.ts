export type PostCategoryId = 'meal_prep' | 'nutrition' | 'advice' | 'prs';

export type FeedViewId = 'feed' | 'recipes' | 'community';

export type ApiFeedCategory = PostCategoryId | 'main_feed';

export type UploadCategoryId = PostCategoryId;

export type FeedLayoutType = 'scroll' | 'grid' | 'thread';

export interface FeedView {
  id: FeedViewId;
  label: string;
  description: string;
  layout: FeedLayoutType;
}

export interface UploadViewOption {
  view: FeedViewId;
  category: PostCategoryId;
  label: string;
  description: string;
  captionPlaceholder: string;
}

export const FEED_VIEWS: FeedView[] = [
  { id: 'feed', label: 'Feed', description: 'Workout videos and PRs', layout: 'scroll' },
  { id: 'recipes', label: 'Recipes', description: 'Meal prep and nutrition', layout: 'grid' },
  { id: 'community', label: 'Community', description: 'Threads and coaching', layout: 'thread' },
];

export const UPLOAD_VIEW_OPTIONS: UploadViewOption[] = [
  {
    view: 'feed',
    category: 'prs',
    label: 'Workout / PR',
    description: 'Lifts, form checks, and milestone clips',
    captionPlaceholder: 'Describe your workout or PR...',
  },
  {
    view: 'recipes',
    category: 'meal_prep',
    label: 'Recipe',
    description: 'Meal prep, macros, and nutrition content',
    captionPlaceholder: 'Describe your recipe or meal prep...',
  },
  {
    view: 'community',
    category: 'advice',
    label: 'Community',
    description: 'Coaching tips, Q&A, and discussion starters',
    captionPlaceholder: 'Start a thread or ask the community...',
  },
];

export const RECIPE_SUBCATEGORIES: PostCategoryId[] = ['meal_prep', 'nutrition'];

export const RECIPE_CATEGORIES: PostCategoryId[] = ['meal_prep', 'nutrition'];

const VIEW_CATEGORY_MAP: Record<FeedViewId, PostCategoryId[]> = {
  feed: ['prs'],
  recipes: RECIPE_CATEGORIES,
  community: ['advice'],
};

const MAIN_FEED_EXCLUDED: PostCategoryId[] = ['meal_prep', 'nutrition', 'advice'];

export function getFeedViewLayout(id: FeedViewId): FeedLayoutType {
  return FEED_VIEWS.find((v) => v.id === id)?.layout ?? 'scroll';
}

export function getFeedViewLabel(id: FeedViewId): string {
  return FEED_VIEWS.find((v) => v.id === id)?.label ?? 'Feed';
}

export function getFeedViewForCategory(category?: string | null): FeedViewId {
  if (!category) return 'feed';
  if (RECIPE_CATEGORIES.includes(category as PostCategoryId)) return 'recipes';
  if (category === 'advice') return 'community';
  return 'feed';
}

export function getFeedViewLabelForPost(category?: string | null): string {
  return getFeedViewLabel(getFeedViewForCategory(category));
}

export function getDefaultUploadOption(): UploadViewOption {
  return UPLOAD_VIEW_OPTIONS[0];
}

export function getUploadOptionForView(view: FeedViewId): UploadViewOption {
  return UPLOAD_VIEW_OPTIONS.find((option) => option.view === view) ?? UPLOAD_VIEW_OPTIONS[0];
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

export function categoriesForFeedView(view: FeedViewId): PostCategoryId[] {
  return VIEW_CATEGORY_MAP[view];
}
