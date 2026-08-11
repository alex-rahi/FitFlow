export type PostCategoryId = 'meal_prep' | 'nutrition' | 'advice' | 'prs';

export type MediaType = 'video' | 'photo';

export type FeedViewId = 'feed' | 'recipes' | 'community';

export type ApiFeedCategory = PostCategoryId | 'main_feed';

export type UploadCategoryId = PostCategoryId;

export type FeedLayoutType = 'scroll' | 'grid' | 'thread';

export type UploadDestination = FeedViewId;

export interface FeedView {
  id: FeedViewId;
  label: string;
  description: string;
  layout: FeedLayoutType;
}

export interface UploadViewOption {
  destination: UploadDestination;
  category: PostCategoryId;
  mediaType: MediaType;
  label: string;
  description: string;
  captionPlaceholder: string;
}

/** Bottom tab destinations — each maps to one primary layout. */
export const TAB_VIEWS: FeedView[] = [
  { id: 'feed', label: 'Feed', description: 'All workout and recipe videos', layout: 'scroll' },
  { id: 'recipes', label: 'Recipes', description: 'Photo recipe grid from the community', layout: 'grid' },
  { id: 'community', label: 'Community', description: 'Thread-style coaching and Q&A', layout: 'thread' },
];

export const UPLOAD_VIEW_OPTIONS: UploadViewOption[] = [
  {
    destination: 'feed',
    category: 'prs',
    mediaType: 'video',
    label: 'Feed video',
    description: 'Workouts, PRs, and recipe videos for the main scroll',
    captionPlaceholder: 'Describe your workout, PR, or recipe video...',
  },
  {
    destination: 'recipes',
    category: 'meal_prep',
    mediaType: 'photo',
    label: 'Recipe photo',
    description: 'Photo-only uploads for the Recipes grid',
    captionPlaceholder: 'Describe your dish, ingredients, or macros...',
  },
  {
    destination: 'community',
    category: 'advice',
    mediaType: 'video',
    label: 'Community thread',
    description: 'Start a thread with a clip or coaching question',
    captionPlaceholder: 'Start a thread or ask the community...',
  },
];

export const RECIPE_SUBCATEGORIES: PostCategoryId[] = ['meal_prep', 'nutrition'];

export const RECIPE_CATEGORIES: PostCategoryId[] = ['meal_prep', 'nutrition'];

export function getFeedViewLayout(id: FeedViewId): FeedLayoutType {
  return TAB_VIEWS.find((v) => v.id === id)?.layout ?? 'scroll';
}

export function getFeedViewLabel(id: FeedViewId): string {
  return TAB_VIEWS.find((v) => v.id === id)?.label ?? 'Feed';
}

export function getUploadOptionForDestination(destination: UploadDestination): UploadViewOption {
  return UPLOAD_VIEW_OPTIONS.find((option) => option.destination === destination) ?? UPLOAD_VIEW_OPTIONS[0];
}

export function isPhotoPost(post: { media_type?: MediaType | null; category?: string | null }): boolean {
  return post.media_type === 'photo';
}

export function isVideoPost(post: { media_type?: MediaType | null; category?: string | null }): boolean {
  return post.media_type !== 'photo';
}

export function filterPostsForFeedView<T extends { category?: string | null; media_type?: MediaType | null }>(
  posts: T[],
  view: FeedViewId,
): T[] {
  switch (view) {
    case 'feed':
      // Main scroll: all videos including recipe videos; no community threads or photo grid items
      return posts.filter(
        (post) => post.category !== 'advice' && isVideoPost(post),
      );
    case 'recipes':
      return posts.filter(
        (post) => RECIPE_CATEGORIES.includes(post.category as PostCategoryId) && isPhotoPost(post),
      );
    case 'community':
      return posts.filter((post) => post.category === 'advice');
  }
}

export function getFeedViewForCategory(category?: string | null, mediaType?: MediaType | null): FeedViewId {
  if (category === 'advice') return 'community';
  if (RECIPE_CATEGORIES.includes(category as PostCategoryId) && mediaType === 'photo') return 'recipes';
  return 'feed';
}

export function getFeedViewLabelForPost(category?: string | null, mediaType?: MediaType | null): string {
  return getFeedViewLabel(getFeedViewForCategory(category, mediaType));
}
