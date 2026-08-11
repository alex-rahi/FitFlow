import { PLACEHOLDER_ADS, SCROLL_AD_INTERVAL, PlaceholderAd } from '../constants/ads';
import { VideoPost } from '../components/VideoCard';

export type ScrollFeedItem =
  | { type: 'post'; id: string; post: VideoPost; postIndex: number }
  | { type: 'ad'; id: string; ad: PlaceholderAd };

export function buildScrollFeedItems(posts: VideoPost[]): ScrollFeedItem[] {
  const items: ScrollFeedItem[] = [];
  let adCount = 0;

  posts.forEach((post, index) => {
    items.push({ type: 'post', id: post.id, post, postIndex: index });

    const isLast = index === posts.length - 1;
    if (!isLast && (index + 1) % SCROLL_AD_INTERVAL === 0) {
      const ad = PLACEHOLDER_ADS[adCount % PLACEHOLDER_ADS.length];
      adCount += 1;
      items.push({ type: 'ad', id: `ad-${ad.id}-${index}`, ad });
    }
  });

  return items;
}
