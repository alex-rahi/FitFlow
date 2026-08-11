export type PostCategoryId = 'meal_prep' | 'nutrition' | 'advice';

export type MediaType = 'video' | 'photo' | 'text';

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

/** Recipe app destinations — grid first, then video scroll, then kitchen threads. */
export const TAB_VIEWS: FeedView[] = [
  { id: 'recipes', label: 'Recipes', description: 'Photo recipe grid from home cooks', layout: 'grid' },
  { id: 'feed', label: 'Watch', description: 'Recipe videos and cooking reels', layout: 'scroll' },
  { id: 'community', label: 'Kitchen', description: 'Cooking tips, swaps, and Q&A threads', layout: 'thread' },
];

export const UPLOAD_VIEW_OPTIONS: UploadViewOption[] = [
  {
    destination: 'recipes',
    category: 'meal_prep',
    mediaType: 'photo',
    label: 'Recipe photo',
    description: 'Share a finished dish for the recipe grid',
    captionPlaceholder: 'Describe your dish, ingredients, or macros...',
  },
  {
    destination: 'feed',
    category: 'meal_prep',
    mediaType: 'video',
    label: 'Recipe video',
    description: 'Cooking reels and step-by-step recipe videos',
    captionPlaceholder: 'Describe your recipe, technique, or cook time...',
  },
  {
    destination: 'community',
    category: 'advice',
    mediaType: 'text',
    label: 'Kitchen thread',
    description: 'Ask for tips, swaps, or meal-planning help',
    captionPlaceholder: 'Ask the kitchen or share a cooking tip...',
  },
];

export const RECIPE_SUBCATEGORIES: PostCategoryId[] = ['meal_prep', 'nutrition'];

export const RECIPE_CATEGORIES: PostCategoryId[] = ['meal_prep', 'nutrition'];

export function isRecipeCategory(category?: string | null): boolean {
  return RECIPE_CATEGORIES.includes(category as PostCategoryId);
}

export function getFeedViewLayout(id: FeedViewId): FeedLayoutType {
  return TAB_VIEWS.find((v) => v.id === id)?.layout ?? 'scroll';
}

export function getFeedViewLabel(id: FeedViewId): string {
  return TAB_VIEWS.find((v) => v.id === id)?.label ?? 'Recipes';
}

export function getUploadOptionForDestination(destination: UploadDestination): UploadViewOption {
  return UPLOAD_VIEW_OPTIONS.find((option) => option.destination === destination) ?? UPLOAD_VIEW_OPTIONS[0];
}

export function isPhotoPost(post: { media_type?: MediaType | null; category?: string | null }): boolean {
  return post.media_type === 'photo';
}

export function isTextPost(post: { media_type?: MediaType | null; category?: string | null }): boolean {
  return post.media_type === 'text';
}

export function isVideoPost(post: { media_type?: MediaType | null; category?: string | null }): boolean {
  if (post.media_type === 'photo' || post.media_type === 'text') return false;
  return post.media_type === 'video' || post.media_type == null;
}

export function filterPostsForFeedView<T extends { category?: string | null; media_type?: MediaType | null }>(
  posts: T[],
  view: FeedViewId,
): T[] {
  switch (view) {
    case 'feed':
      return posts.filter(
        (post) => isRecipeCategory(post.category) && isVideoPost(post),
      );
    case 'recipes':
      return posts.filter(
        (post) => isRecipeCategory(post.category) && isPhotoPost(post),
      );
    case 'community':
      return posts.filter((post) => post.category === 'advice');
  }
}

export function getFeedViewForCategory(category?: string | null, mediaType?: MediaType | null): FeedViewId {
  if (category === 'advice') return 'community';
  if (isRecipeCategory(category) && mediaType === 'photo') return 'recipes';
  if (isRecipeCategory(category)) return 'feed';
  return 'recipes';
}

export function getFeedViewLabelForPost(category?: string | null, mediaType?: MediaType | null): string {
  return getFeedViewLabel(getFeedViewForCategory(category, mediaType));
}

export function getCategoryLabel(category?: string | null): string {
  switch (category) {
    case 'meal_prep': return 'Meal Prep';
    case 'nutrition': return 'Nutrition';
    case 'advice': return 'Kitchen';
    default: return 'Recipe';
  }
}
