import {
  ApiFeedCategory,
  FeedViewId,
  filterPostsForFeedView,
  PHOTO_CATEGORIES,
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
  isDemoMode,
  isLocalYoloMode,
  API_URL,
} from '../constants/theme';
import { createPlaceholderSession, delay } from './placeholders';
import { rankPostsByEngagement } from './feedRanking';
import { MediaType } from '../constants/categories';
import { supabase } from './supabase';

class ApiClient {
  private async getToken(): Promise<string | null> {
    if (isDemoMode() || isLocalYoloMode()) return 'placeholder-access-token';
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    if (isDemoMode() && !isLocalYoloMode()) {
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
      if (isDemoMode()) {
        await delay(300);
        return PLACEHOLDER_PROFILE;
      }
      throw new Error('Failed to load profile');
    }
  };

  updateProfile = async (data: any) => {
    if (isDemoMode()) {
      await delay(300);
      return { ...PLACEHOLDER_PROFILE, ...data };
    }
    return this.request<any>('/profiles/me', { method: 'PATCH', body: JSON.stringify(data) });
  };

  searchProfiles = async (q: string) => {
    try {
      return await this.request<any[]>(`/profiles/search?q=${encodeURIComponent(q)}`);
    } catch {
      if (isDemoMode()) {
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
      if (isDemoMode()) {
        await delay(400);
        let posts = category === 'main_feed'
          ? [...PLACEHOLDER_POSTS]
          : PLACEHOLDER_POSTS.filter((p) => p.category === category);
        posts = mergePublishedUploads(
          posts,
          category === 'main_feed' ? 'feed' : category === 'advice' ? 'community' : 'photos',
        );
        return { posts, next_cursor: null };
      }
      return { posts: [], next_cursor: null };
    }
  };

  getFeedView = async (view: FeedViewId, cursor?: string) => {
    if (view === 'community') {
      return this.getFeed(cursor, 'advice');
    }

    if (view === 'photos') {
      if (isDemoMode()) {
        await delay(200);
        const posts = mergePublishedUploads([...PLACEHOLDER_RECIPE_PHOTOS], 'photos');
        return { posts: filterPostsForFeedView(posts, 'photos'), next_cursor: null };
      }
      const pages = await Promise.all(
        PHOTO_CATEGORIES.map((category) => this.getFeed(cursor, category)),
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
    category: string = 'workouts',
    mediaType: MediaType = 'video',
    photoUri?: string | null,
  ) => {
    if (isDemoMode() && !isLocalYoloMode()) {
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
      getUploadStore().unshift(post);
      return post;
    }
    const token = await this.getToken();
    if (!token) {
      throw new Error('You must be signed in to upload');
    }
    const created = await this.request<any>('/posts', {
      method: 'POST',
      body: JSON.stringify({ caption, category, media_type: mediaType }),
    });
    getUploadStore().unshift({
      ...created,
      caption,
      category,
      media_type: mediaType,
      photo_uri: photoUri ?? null,
      status: 'processing',
      author: created.author ?? { username: 'you', display_name: 'You' },
    });
    return created;
  };

  getPost = (id: string) => this.request<any>(`/posts/${id}`);

  getUserPosts = async (userId: string) => {
    try {
      return await this.request<any[]>(`/posts/user/${userId}`);
    } catch {
      if (isDemoMode()) {
        await delay(200);
        const all = [...PLACEHOLDER_POSTS, ...PLACEHOLDER_RECIPE_PHOTOS, ...getUploadStore().filter((p) => p.status === 'published')];
        return all.filter(
          (post) => post.user_id === userId || userId === PLACEHOLDER_USER_ID,
        );
      }
      return [];
    }
  };

  searchPosts = async (query: string, view: FeedViewId = 'feed') => {
    const q = query.toLowerCase();
    if (isDemoMode()) {
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
    if (isDemoMode()) {
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
    if (isDemoMode()) {
      await delay(400);
      return { id: postId, status: 'processing', moderation_decision: null };
    }
    return this.request<any>(`/posts/${postId}/confirm-upload`, { method: 'POST' });
  };

  /** Upload media to the backend for local YOLO moderation. */
  uploadMediaFile = async (postId: string, uri: string, mediaType: 'video' | 'photo') => {
    if (isDemoMode() && !isLocalYoloMode()) {
      await delay(600);
      return;
    }

    const token = await this.getToken();
    if (!token) throw new Error('You must be signed in to upload');

    const response = await fetch(uri);
    if (!response.ok) throw new Error('Could not read the selected media file');
    const blob = await response.blob();
    const ext = mediaType === 'photo' ? 'jpg' : 'mp4';
    const form = new FormData();
    form.append('file', blob, `upload.${ext}`);

    const res = await fetch(`${API_URL}/api/v1/moderation/posts/${postId}/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(typeof err.detail === 'string' ? err.detail : 'Upload failed');
    }
    return res.json();
  };

  /** Runs YOLO moderation — auto-publishes on clear pass, human review if flagged. */
  runYoloModeration = async (postId: string) => {
    const store = getUploadStore();
    const post = store.find((p) => String(p.id) === String(postId));
    const isText = post?.media_type === 'text';

    if (isDemoMode() && !isLocalYoloMode()) {
      await delay(isText ? 600 : 1200);
      if (post) {
        post.status = 'published';
        post.moderation_decision = 'publish';
      }
      return { id: postId, status: 'published', moderation_decision: 'publish' };
    }

    if (isLocalYoloMode()) {
      try {
        const result = await this.request<any>(`/moderation/posts/${postId}/run`, { method: 'POST' });
        if (post) {
          post.status = result.status;
          post.moderation_decision = result.moderation_decision;
          post.detection_labels = result.detection_labels;
        }
        return result;
      } catch (err) {
        if (post) post.status = 'rejected';
        throw err;
      }
    }

    for (let attempt = 0; attempt < 12; attempt++) {
      try {
        const remote = await this.getPost(postId);
        if (remote.status === 'published') return remote;
        if (remote.status === 'pending_review') return remote;
        if (remote.status === 'rejected') {
          throw new Error('Post rejected by content moderation');
        }
      } catch (err) {
        if (err instanceof Error && err.message.includes('rejected')) throw err;
      }
      await delay(1500);
    }

    throw new Error('Moderation timed out — check back shortly');
  };

  likePost = async (postId: string) => {
    if (isDemoMode()) {
      await delay(100);
      return;
    }
    return this.request<void>(`/posts/${postId}/like`, { method: 'POST' });
  };

  unlikePost = (postId: string) => this.request<void>(`/posts/${postId}/like`, { method: 'DELETE' });
  getComments = async (postId: string): Promise<ThreadComment[]> => {
    if (isDemoMode()) {
      await delay(200);
      return getCommentsForPost(postId);
    }
    return this.request<ThreadComment[]>(`/posts/${postId}/comments`);
  };

  addComment = async (postId: string, content: string, parentId?: string | null): Promise<ThreadComment> => {
    if (isDemoMode()) {
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
    if (isDemoMode()) {
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
    if (isDemoMode()) return Promise.resolve();
    return this.request<void>(`/notifications/${id}/read`, { method: 'PATCH' });
  };

  markAllNotificationsRead = () => {
    if (isDemoMode()) return Promise.resolve();
    return this.request<void>('/notifications/read-all', { method: 'POST' });
  };

  followUser = (userId: string) => this.request<void>(`/users/${userId}/follow`, { method: 'POST' });
  unfollowUser = (userId: string) => this.request<void>(`/users/${userId}/follow`, { method: 'DELETE' });
}

export const api = new ApiClient();
export { createPlaceholderSession };

const uploadedPosts: Array<Record<string, unknown>> = [];

type UploadStoreWindow = Window & { __gymtokUploadedPosts?: Array<Record<string, unknown>> };

function getUploadStore(): Array<Record<string, unknown>> {
  if (typeof window !== 'undefined') {
    const w = window as UploadStoreWindow;
    if (!w.__gymtokUploadedPosts) {
      w.__gymtokUploadedPosts = uploadedPosts;
    }
    return w.__gymtokUploadedPosts;
  }
  return uploadedPosts;
}

function mergePublishedUploads(posts: Array<Record<string, unknown>>, view: FeedViewId) {
  const uploaded = filterPostsForFeedView(
    getUploadStore().filter((post) => post.status === 'published'),
    view,
  );
  return [...uploaded, ...posts];
}
