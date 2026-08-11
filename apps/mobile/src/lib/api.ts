import {
  ApiFeedCategory,
  FeedViewId,
  filterPostsForFeedView,
  RECIPE_CATEGORIES,
} from '../constants/categories';
import {
  PLACEHOLDER_THREAD_COMMENTS,
  ThreadComment,
  getCommentsForPost,
} from '../constants/threadComments';
import {
  PLACEHOLDER_POSTS,
  PLACEHOLDER_RECIPE_PHOTOS,
  PLACEHOLDER_PROFILE,
  PLACEHOLDER_USERS,
  PLACEHOLDER_NOTIFICATIONS,
  PLACEHOLDER_USER_ID,
  USE_PLACEHOLDERS,
  API_URL,
} from '../constants/theme';
import { rankPostsByEngagement } from './feedRanking';
import { createPlaceholderSession, delay } from './placeholders';
import { MediaType } from '../constants/categories';
import { supabase } from './supabase';

class ApiClient {
  private async getToken(): Promise<string | null> {
    if (USE_PLACEHOLDERS) return 'placeholder-access-token';
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    if (USE_PLACEHOLDERS) {
      throw new Error('placeholder-mode');
    }

    const token = await this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_URL}/api/v1${path}`, { ...options, headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      const detail = err.detail;
      const message = typeof detail === 'string'
        ? detail
        : Array.isArray(detail)
          ? detail.map((d: { msg?: string }) => d.msg).filter(Boolean).join(', ')
          : res.statusText;
      throw new Error(message || 'Request failed');
    }
    if (res.status === 204) return undefined as T;
    return res.json();
  }

  getProfile = async () => {
    try {
      return await this.request<any>('/profiles/me');
    } catch {
      if (USE_PLACEHOLDERS) {
        await delay(300);
        return PLACEHOLDER_PROFILE;
      }
      throw new Error('Failed to load profile');
    }
  };

  updateProfile = async (data: any) => {
    if (USE_PLACEHOLDERS) {
      await delay(300);
      return { ...PLACEHOLDER_PROFILE, ...data };
    }
    return this.request<any>('/profiles/me', { method: 'PATCH', body: JSON.stringify(data) });
  };

  searchProfiles = async (q: string) => {
    try {
      return await this.request<any[]>(`/profiles/search?q=${encodeURIComponent(q)}`);
    } catch {
      if (USE_PLACEHOLDERS) {
        await delay(200);
        return PLACEHOLDER_USERS.filter(
          (u) => u.username.includes(q.toLowerCase()) || u.display_name?.toLowerCase().includes(q.toLowerCase())
        );
      }
      return [];
    }
  };

  getProfileById = (id: string) => this.request<any>(`/profiles/${id}`);

  getFeed = async (cursor?: string, category: ApiFeedCategory = 'main_feed') => {
    const categoryParam = category !== 'main_feed' ? `&category=${category}` : '';
    const cursorParam = cursor ? `cursor=${cursor}` : '';
    const query = [cursorParam, categoryParam.replace(/^&/, '')].filter(Boolean).join('&');
    try {
      return await this.request<any>(`/posts/feed${query ? `?${query}` : ''}`);
    } catch {
      if (USE_PLACEHOLDERS) {
        await delay(400);
        let posts = category === 'main_feed'
          ? [...PLACEHOLDER_POSTS]
          : PLACEHOLDER_POSTS.filter((p) => p.category === category);
        posts = mergePublishedUploads(posts, category === 'main_feed' ? 'feed' : category === 'advice' ? 'community' : 'recipes');
        return { posts, next_cursor: null };
      }
      return { posts: [], next_cursor: null };
    }
  };

  getFeedView = async (view: FeedViewId, cursor?: string) => {
    if (view === 'community') {
      return this.getFeed(cursor, 'advice');
    }

    if (view === 'recipes') {
      if (USE_PLACEHOLDERS) {
        await delay(200);
        const posts = mergePublishedUploads([...PLACEHOLDER_RECIPE_PHOTOS], 'recipes');
        return { posts: filterPostsForFeedView(posts, 'recipes'), next_cursor: null };
      }
      const pages = await Promise.all(
        RECIPE_CATEGORIES.map((category) => this.getFeed(cursor, category)),
      );
      const posts = pages
        .flatMap((page) => page.posts)
        .filter((post: { media_type?: string }) => post.media_type === 'photo');
      return { posts, next_cursor: pages.find((page) => page.next_cursor)?.next_cursor ?? null };
    }

    const data = await this.getFeed(cursor, 'main_feed');
    return {
      posts: rankPostsByEngagement(filterPostsForFeedView(data.posts, 'feed')),
      next_cursor: data.next_cursor,
    };
  };

  createPost = async (
    caption?: string,
    category: string = 'prs',
    mediaType: MediaType = 'video',
    photoUri?: string | null,
  ) => {
    if (USE_PLACEHOLDERS) {
      await delay(300);
      const post = {
        id: `post-${Date.now()}`,
        user_id: PLACEHOLDER_USER_ID,
        caption,
        category,
        media_type: mediaType,
        photo_uri: photoUri ?? null,
        status: 'processing',
        moderation_decision: null,
        like_count: 0,
        comment_count: 0,
        view_count: 0,
        created_at: new Date().toISOString(),
        author: { username: 'you', display_name: 'You' },
      };
      uploadedPosts.unshift(post);
      return post;
    }
    const token = await this.getToken();
    if (!token) {
      throw new Error('You must be signed in to upload');
    }
    return this.request<any>('/posts', { method: 'POST', body: JSON.stringify({ caption, category }) });
  };

  getPost = (id: string) => this.request<any>(`/posts/${id}`);

  getUserPosts = async (userId: string) => {
    try {
      return await this.request<any[]>(`/posts/user/${userId}`);
    } catch {
      if (USE_PLACEHOLDERS) {
        await delay(200);
        const all = [...PLACEHOLDER_POSTS, ...PLACEHOLDER_RECIPE_PHOTOS, ...uploadedPosts.filter((p) => p.status === 'published')];
        return all.filter(
          (post) => post.user_id === userId || userId === PLACEHOLDER_USER_ID,
        );
      }
      return [];
    }
  };

  searchPosts = async (query: string, view: FeedViewId) => {
    const q = query.toLowerCase();
    if (USE_PLACEHOLDERS) {
      await delay(200);
      const data = await this.getFeedView(view);
      return data.posts.filter((post) =>
        (post.caption ?? '').toLowerCase().includes(q)
        || (post.author?.username ?? '').toLowerCase().includes(q),
      );
    }
    try {
      const data = await this.getFeedView(view);
      return data.posts.filter((post: { caption?: string; author?: { username?: string } }) =>
        (post.caption ?? '').toLowerCase().includes(q)
        || (post.author?.username ?? '').toLowerCase().includes(q),
      );
    } catch {
      return [];
    }
  };

  getUploadUrl = async (postId: string) => {
    if (USE_PLACEHOLDERS) {
      await delay(300);
      return {
        post_id: postId,
        upload_url: 'https://placeholder.supabase.co/storage/v1/object/raw-uploads/placeholder.mp4',
        storage_path: 'placeholder/placeholder.mp4',
      };
    }
    return this.request<any>(`/posts/${postId}/upload-url`, { method: 'POST' });
  };

  confirmUpload = async (postId: string) => {
    if (USE_PLACEHOLDERS) {
      await delay(400);
      return { id: postId, status: 'processing', moderation_decision: null };
    }
    return this.request<any>(`/posts/${postId}/confirm-upload`, { method: 'POST' });
  };

  /** Runs YOLO moderation and auto-publishes on pass — no manual review queue. */
  runYoloModeration = async (postId: string) => {
    if (USE_PLACEHOLDERS) {
      const post = uploadedPosts.find((p) => p.id === postId);
      const isText = post?.media_type === 'text';
      await delay(isText ? 600 : 1200);
      if (post) {
        post.status = 'published';
        post.moderation_decision = 'publish';
      }
      return { id: postId, status: 'published', moderation_decision: 'publish' };
    }

    const deadline = Date.now() + 60_000;
    while (Date.now() < deadline) {
      const post = await this.getPost(postId);
      if (post.status === 'published') {
        return post;
      }
      if (post.status === 'rejected') {
        throw new Error('Post rejected by YOLO content moderation');
      }
      await delay(1500);
    }
    throw new Error('YOLO moderation timed out — check back shortly');
  };

  likePost = async (postId: string) => {
    if (USE_PLACEHOLDERS) {
      await delay(100);
      return;
    }
    return this.request<void>(`/posts/${postId}/like`, { method: 'POST' });
  };

  unlikePost = (postId: string) => this.request<void>(`/posts/${postId}/like`, { method: 'DELETE' });
  getComments = async (postId: string): Promise<ThreadComment[]> => {
    if (USE_PLACEHOLDERS) {
      await delay(200);
      return getCommentsForPost(postId);
    }
    return this.request<ThreadComment[]>(`/posts/${postId}/comments`);
  };

  addComment = async (postId: string, content: string, parentId?: string | null): Promise<ThreadComment> => {
    if (USE_PLACEHOLDERS) {
      await delay(200);
      const comment: ThreadComment = {
        id: `comment-${Date.now()}`,
        post_id: postId,
        parent_id: parentId ?? null,
        content,
        like_count: 0,
        created_at: new Date().toISOString(),
        author: { username: 'you', display_name: 'You' },
      };
      PLACEHOLDER_THREAD_COMMENTS.push(comment);
      return comment;
    }
    return this.request<ThreadComment>(`/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content, parent_id: parentId ?? null }),
    });
  };

  getNotifications = async () => {
    if (USE_PLACEHOLDERS) {
      await delay(300);
      return PLACEHOLDER_NOTIFICATIONS;
    }
    try {
      return await this.request<any[]>('/notifications');
    } catch {
      return PLACEHOLDER_NOTIFICATIONS;
    }
  };

  markNotificationRead = (id: string) => {
    if (USE_PLACEHOLDERS) return Promise.resolve();
    return this.request<void>(`/notifications/${id}/read`, { method: 'PATCH' });
  };

  markAllNotificationsRead = () => {
    if (USE_PLACEHOLDERS) return Promise.resolve();
    return this.request<void>('/notifications/read-all', { method: 'POST' });
  };

  followUser = (userId: string) => this.request<void>(`/users/${userId}/follow`, { method: 'POST' });
  unfollowUser = (userId: string) => this.request<void>(`/users/${userId}/follow`, { method: 'DELETE' });
}

export const api = new ApiClient();
export { createPlaceholderSession };

const uploadedPosts: Array<Record<string, unknown>> = [];

function mergePublishedUploads(posts: Array<Record<string, unknown>>, view: FeedViewId) {
  const uploaded = filterPostsForFeedView(
    uploadedPosts.filter((post) => post.status === 'published'),
    view,
  );
  return [...uploaded, ...posts];
}
