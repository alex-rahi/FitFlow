export type PostCategoryId = 'workouts' | 'equipment' | 'nutrition' | 'prs' | 'advice';

export type MediaType = 'video' | 'form' | 'text';

export type FeedViewId = 'feed' | 'form' | 'community';

export type ApiFeedCategory = PostCategoryId | 'main_feed';

export type FeedLaneId = ApiFeedCategory | 'form' | 'community';

export type UploadCategoryId = PostCategoryId;

export type FeedLayoutType = 'scroll' | 'grid' | 'thread';

export type UploadDestination = FeedViewId;

export interface FeedView {
  id: FeedViewId;
  label: string;
  description: string;
  layout: FeedLayoutType;
}

export const TAB_VIEWS: FeedView[] = [
  { id: 'feed', label: 'Feed', description: 'Fitness videos ranked by engagement', layout: 'scroll' },
  { id: 'form', label: 'Form', description: 'Structured workout logs from the community', layout: 'scroll' },
  { id: 'community', label: 'Community', description: 'Training tips and discussion threads', layout: 'thread' },
];

/** Horizontal lanes — swipe ← → to switch. */
export const FEED_LANES: { id: FeedLaneId; label: string }[] = [
  { id: 'main_feed', label: 'For You' },
  { id: 'workouts', label: 'Workouts' },
  { id: 'equipment', label: 'Equipment' },
  { id: 'nutrition', label: 'Nutrition' },
  { id: 'prs', label: 'PRs' },
  { id: 'form', label: 'Form' },
  { id: 'community', label: 'Talk' },
];

export const FORM_CATEGORIES: PostCategoryId[] = ['workouts', 'prs'];

export function isEquipmentPost(post: {
  category?: string | null;
  topics?: string[] | null;
}): boolean {
  return post.category === 'equipment' || (post.topics?.includes('equipment') ?? false);
}

export function isFormCategory(category?: string | null): boolean {
  return FORM_CATEGORIES.includes(category as PostCategoryId);
}

export function isAdviceCategory(category?: string | null): boolean {
  return category === 'advice';
}

export function getFeedViewLayout(id: FeedViewId): FeedLayoutType {
  return TAB_VIEWS.find((v) => v.id === id)?.layout ?? 'scroll';
}

export function getFeedViewLabel(id: FeedViewId): string {
  return TAB_VIEWS.find((v) => v.id === id)?.label ?? 'Feed';
}

export function isVideoPost(post: { media_type?: string | null }): boolean {
  return post.media_type !== 'form' && post.media_type !== 'text';
}

export function isFormPost(post: { media_type?: string | null }): boolean {
  return post.media_type === 'form';
}

export function isTextPost(post: { media_type?: string | null }): boolean {
  return post.media_type === 'text';
}

export function filterPostsForFeedView<T extends { category?: string | null; media_type?: string | null }>(
  posts: T[],
  view: FeedViewId,
): T[] {
  switch (view) {
    case 'feed':
      return posts.filter((post) => isVideoPost(post) && post.category !== 'advice');
    case 'form':
      return posts.filter((post) => isFormPost(post) && isFormCategory(post.category));
    case 'community':
      return posts.filter((post) => isAdviceCategory(post.category) || isTextPost(post));
    default:
      return posts;
  }
}

export function filterPostsForLane<T extends { category?: string | null; media_type?: string | null }>(
  posts: T[],
  laneId: FeedLaneId,
): T[] {
  if (laneId === 'form') return filterPostsForFeedView(posts, 'form');
  if (laneId === 'community') return filterPostsForFeedView(posts, 'community');
  const scrollMedia = posts.filter(
    (post) => isVideoPost(post) && post.category !== 'advice',
  );
  if (laneId === 'main_feed') return scrollMedia;
  if (laneId === 'equipment') {
    return scrollMedia.filter((post) => isEquipmentPost(post));
  }
  return scrollMedia.filter((post) => post.category === laneId);
}

export function getCategoryLabel(category?: string | null): string {
  switch (category) {
    case 'workouts': return 'Workout';
    case 'equipment': return 'Equipment';
    case 'nutrition': return 'Nutrition';
    case 'prs': return 'PR';
    case 'advice': return 'Community';
    default: return 'Fitness';
  }
}

export function getUploadDestinationForCategory(
  category: PostCategoryId,
  mediaType: MediaType = 'video',
): UploadDestination {
  if (mediaType === 'text' || category === 'advice') return 'community';
  if (mediaType === 'form') return 'form';
  return 'feed';
}
