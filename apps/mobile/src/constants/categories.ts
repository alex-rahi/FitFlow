export type PostCategoryId = 'meal_prep' | 'nutrition';

export type MediaType = 'photo';

export type FeedViewId = 'recipes';

export type ApiFeedCategory = PostCategoryId | 'main_feed';

export type UploadCategoryId = PostCategoryId;

export type FeedLayoutType = 'grid';

export type UploadDestination = FeedViewId;

export interface FeedView {
  id: FeedViewId;
  label: string;
  description: string;
  layout: FeedLayoutType;
}

export const TAB_VIEWS: FeedView[] = [
  { id: 'recipes', label: 'Recipes', description: 'Photo recipe grid from home cooks', layout: 'grid' },
];

export const RECIPE_SUBCATEGORIES: PostCategoryId[] = ['meal_prep', 'nutrition'];

export const RECIPE_CATEGORIES: PostCategoryId[] = ['meal_prep', 'nutrition'];

export function isRecipeCategory(category?: string | null): boolean {
  return RECIPE_CATEGORIES.includes(category as PostCategoryId);
}

export function getFeedViewLayout(_id: FeedViewId = 'recipes'): FeedLayoutType {
  return 'grid';
}

export function getFeedViewLabel(_id: FeedViewId = 'recipes'): string {
  return 'Recipes';
}

export function isPhotoPost(post: { media_type?: string | null }): boolean {
  return post.media_type !== 'video' && post.media_type !== 'text';
}

export function filterPostsForFeedView<T extends { category?: string | null; media_type?: string | null }>(
  posts: T[],
  _view: FeedViewId = 'recipes',
): T[] {
  return posts.filter(
    (post) => isRecipeCategory(post.category) && isPhotoPost(post),
  );
}

export function getCategoryLabel(category?: string | null): string {
  switch (category) {
    case 'meal_prep': return 'Meal Prep';
    case 'nutrition': return 'Nutrition';
    default: return 'Recipe';
  }
}
