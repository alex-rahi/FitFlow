export const PLACEHOLDER_SUPABASE_URL = 'https://placeholder.supabase.co';
export const PLACEHOLDER_ANON_KEY = 'placeholder-anon-key-replace-me';

export const USE_PLACEHOLDERS =
  process.env.EXPO_PUBLIC_USE_PLACEHOLDERS === 'true' ||
  !process.env.EXPO_PUBLIC_SUPABASE_URL ||
  process.env.EXPO_PUBLIC_SUPABASE_URL.includes('placeholder');

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000';
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? PLACEHOLDER_SUPABASE_URL;
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? PLACEHOLDER_ANON_KEY;

export const PLACEHOLDER_USER_ID = '00000000-0000-4000-8000-000000000001';

export const PLACEHOLDER_PROFILE = {
  id: PLACEHOLDER_USER_ID,
  username: 'alex_lifts',
  display_name: 'Alex Lifts',
  avatar_url: null,
  bio: 'Placeholder profile — swap in real Supabase credentials to go live.',
  trust_level: 85,
  follower_count: 1284,
  following_count: 312,
  post_count: 47,
  created_at: '2025-01-15T10:00:00Z',
};

export const PLACEHOLDER_POSTS = [
  {
    id: '10000000-0000-4000-8000-000000000001',
    user_id: PLACEHOLDER_USER_ID,
    caption: 'Heavy deadlift PR — 405 lbs 💪 Form check welcome!',
    thumbnail_url: null,
    status: 'published',
    like_count: 842,
    comment_count: 56,
    view_count: 12400,
    created_at: '2025-07-28T18:30:00Z',
    author: { username: 'alex_lifts', display_name: 'Alex Lifts' },
  },
  {
    id: '10000000-0000-4000-8000-000000000002',
    user_id: '00000000-0000-4000-8000-000000000002',
    caption: 'Morning leg day — squats & lunges 🔥',
    thumbnail_url: null,
    status: 'published',
    like_count: 1203,
    comment_count: 89,
    view_count: 18700,
    created_at: '2025-07-27T09:15:00Z',
    author: { username: 'fitness_jade', display_name: 'Jade Fitness' },
  },
  {
    id: '10000000-0000-4000-8000-000000000003',
    user_id: '00000000-0000-4000-8000-000000000003',
    caption: 'Bench press 225x5 — slow & controlled reps',
    thumbnail_url: null,
    status: 'published',
    like_count: 567,
    comment_count: 34,
    view_count: 9200,
    created_at: '2025-07-26T20:00:00Z',
    author: { username: 'bench_king', display_name: 'Bench King' },
  },
];

export const PLACEHOLDER_USERS = [
  PLACEHOLDER_PROFILE,
  {
    id: '00000000-0000-4000-8000-000000000002',
    username: 'fitness_jade',
    display_name: 'Jade Fitness',
    avatar_url: null,
    bio: 'Certified trainer · HIIT & strength',
    follower_count: 8420,
    following_count: 210,
    post_count: 156,
  },
  {
    id: '00000000-0000-4000-8000-000000000003',
    username: 'bench_king',
    display_name: 'Bench King',
    avatar_url: null,
    bio: 'Powerlifting · 405 bench goal',
    follower_count: 3200,
    following_count: 89,
    post_count: 72,
  },
];

export const PLACEHOLDER_NOTIFICATIONS = [
  {
    id: '40000000-0000-4000-8000-000000000001',
    type: 'like',
    title: 'fitness_jade liked your video',
    body: 'Heavy deadlift PR — 405 lbs 💪',
    read: false,
    created_at: '2025-07-30T14:00:00Z',
  },
  {
    id: '40000000-0000-4000-8000-000000000002',
    type: 'follow',
    title: 'bench_king started following you',
    body: null,
    read: false,
    created_at: '2025-07-30T12:30:00Z',
  },
  {
    id: '40000000-0000-4000-8000-000000000003',
    type: 'comment',
    title: 'fitness_jade commented on your video',
    body: 'Great form on that deadlift! 💪',
    read: true,
    created_at: '2025-07-29T18:00:00Z',
  },
];

export const Colors = {
  red: '#E63946',
  redHover: '#D62839',
  redPressed: '#C1121F',
  matteBlack: '#0A0A0A',
  surface: 'rgba(10, 10, 10, 0.72)',
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.72)',
  textMuted: 'rgba(255, 255, 255, 0.48)',
  borderSubtle: 'rgba(255, 255, 255, 0.18)',
  cardBg: '#141414',
  success: '#2ECC71',
  warning: '#F39C12',
  error: '#E74C3C',
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  monogram: 18,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};
