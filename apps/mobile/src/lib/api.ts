import { FeedCategoryId } from '../constants/categories';
import {
  PLACEHOLDER_THREAD_COMMENTS,
  ThreadComment,
  getCommentsForPost,
} from '../constants/threadComments';
import {
  PLACEHOLDER_POSTS,
  PLACEHOLDER_PROFILE,
  PLACEHOLDER_USERS,
  PLACEHOLDER_NOTIFICATIONS,
  USE_PLACEHOLDERS,
} from '../constants/theme';
import { createPlaceholderSession, delay } from './placeholders';
import { supabase } from './supabase';
import { API_URL } from '../constants/theme';

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
      throw new Error(err.detail ?? 'Request failed');
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

  getFeed = async (cursor?: string, category: FeedCategoryId = 'main_feed') => {
    const categoryParam = category !== 'main_feed' ? `&category=${category}` : '';
    const cursorParam = cursor ? `cursor=${cursor}` : '';
    const query = [cursorParam, categoryParam.replace(/^&/, '')].filter(Boolean).join('&');
    try {
      return await this.request<any>(`/posts/feed${query ? `?${query}` : ''}`);
    } catch {
      if (USE_PLACEHOLDERS) {
        await delay(400);
        const posts = category === 'main_feed'
          ? PLACEHOLDER_POSTS
          : PLACEHOLDER_POSTS.filter((p) => p.category === category);
        return { posts, next_cursor: null };
      }
      return { posts: [], next_cursor: null };
    }
  };

  createPost = async (caption?: string, category: string = 'meal_prep') => {
    if (USE_PLACEHOLDERS) {
      await delay(500);
      return {
        id: `post-${Date.now()}`,
        caption,
        category,
        status: 'processing',
      };
    }
    const token = await this.getToken();
    if (!token) {
      throw new Error('You must be signed in to upload');
    }
    return this.request<any>('/posts', { method: 'POST', body: JSON.stringify({ caption, category }) });
  };

  getPost = (id: string) => this.request<any>(`/posts/${id}`);
  getUserPosts = (userId: string) => this.request<any[]>(`/posts/user/${userId}`);

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
      await delay(800);
      return { id: postId, status: 'processing', moderation_decision: 'pending' };
    }
    return this.request<any>(`/posts/${postId}/confirm-upload`, { method: 'POST' });
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
