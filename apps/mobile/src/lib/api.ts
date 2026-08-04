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

  getFeed = async (cursor?: string) => {
    try {
      return await this.request<any>(`/posts/feed${cursor ? `?cursor=${cursor}` : ''}`);
    } catch {
      if (USE_PLACEHOLDERS) {
        await delay(400);
        return { posts: PLACEHOLDER_POSTS, next_cursor: null };
      }
      return { posts: [], next_cursor: null };
    }
  };

  createPost = async (caption?: string) => {
    if (USE_PLACEHOLDERS) {
      await delay(500);
      return {
        id: `post-${Date.now()}`,
        caption,
        status: 'processing',
      };
    }
    return this.request<any>('/posts', { method: 'POST', body: JSON.stringify({ caption }) });
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
  getComments = async (postId: string) => {
    if (USE_PLACEHOLDERS) {
      await delay(200);
      return [
        { id: '1', content: 'Great form! 💪', author: { username: 'fitness_jade' }, created_at: '2025-07-30T12:00:00Z' },
        { id: '2', content: 'What weight is that?', author: { username: 'bench_king' }, created_at: '2025-07-30T11:30:00Z' },
      ];
    }
    return this.request<any[]>(`/posts/${postId}/comments`);
  };

  addComment = async (postId: string, content: string) => {
    if (USE_PLACEHOLDERS) {
      await delay(200);
      return { id: Date.now().toString(), content, author: { username: 'you' }, created_at: new Date().toISOString() };
    }
    return this.request<any>(`/posts/${postId}/comments`, { method: 'POST', body: JSON.stringify({ content }) });
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
