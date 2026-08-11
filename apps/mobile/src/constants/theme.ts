export const APP_NAME = 'GymTok';
export const APP_TAGLINE = 'Train. Share. Grow.';
export const APP_MONOGRAM = 'GT';
export const PLACEHOLDER_SUPABASE_URL = 'https://placeholder.supabase.co';
export const PLACEHOLDER_ANON_KEY = 'placeholder-anon-key-replace-me';

export const USE_PLACEHOLDERS =
  process.env.EXPO_PUBLIC_USE_PLACEHOLDERS === 'true' ||
  !process.env.EXPO_PUBLIC_SUPABASE_URL ||
  process.env.EXPO_PUBLIC_SUPABASE_URL.includes('placeholder');

const DEMO_HOST_PATTERN = /gym-tok-demo/i;

/** Runtime demo detection — Vercel preview builds may bake in live env vars. */
export function isDemoMode(): boolean {
  if (USE_PLACEHOLDERS) return true;
  if (typeof window !== 'undefined' && DEMO_HOST_PATTERN.test(window.location.hostname)) {
    return true;
  }
  return false;
}

export function isLocalYoloMode(): boolean {
  return process.env.EXPO_PUBLIC_USE_LOCAL_YOLO === 'true';
}

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000';
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? PLACEHOLDER_SUPABASE_URL;
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? PLACEHOLDER_ANON_KEY;

export const PLACEHOLDER_USER_ID = '00000000-0000-4000-8000-000000000001';

export const PLACEHOLDER_PROFILE = {
  id: PLACEHOLDER_USER_ID,
  username: 'alex_lifts',
  display_name: 'Alex Lifts',
  avatar_url: null,
  bio: 'Powerlifting · 405 squat · sharing the grind',
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
    category: 'workouts',
    media_type: 'video' as const,
    topics: ['workouts', 'prs'],
    caption: '405 lb squat PR — 3 months of block training 🔥',
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
    category: 'workouts',
    media_type: 'video' as const,
    caption: 'Push day — 225 bench for 5 @ RPE 8',
    thumbnail_url: null,
    status: 'published',
    like_count: 1203,
    comment_count: 89,
    view_count: 18700,
    created_at: '2025-07-27T09:15:00Z',
    author: { username: 'jade_strong', display_name: 'Jade Strong' },
  },
  {
    id: '10000000-0000-4000-8000-000000000003',
    user_id: '00000000-0000-4000-8000-000000000003',
    category: 'nutrition',
    media_type: 'video' as const,
    topics: ['nutrition', 'meal_prep'],
    caption: 'What I eat on a cut — 180g protein, full day breakdown',
    thumbnail_url: null,
    status: 'published',
    like_count: 567,
    comment_count: 34,
    view_count: 9200,
    created_at: '2025-07-26T20:00:00Z',
    author: { username: 'macro_mike', display_name: 'Macro Mike' },
  },
  {
    id: '10000000-0000-4000-8000-000000000004',
    user_id: '00000000-0000-4000-8000-000000000002',
    category: 'advice',
    media_type: 'text' as const,
    topics: ['advice', 'equipment'],
    caption: 'Best belt for sumo deadlift under $100?',
    thumbnail_url: null,
    status: 'published',
    like_count: 2104,
    comment_count: 3,
    view_count: 28400,
    created_at: '2025-07-25T16:45:00Z',
    author: { username: 'jade_strong', display_name: 'Jade Strong' },
  },
  {
    id: '10000000-0000-4000-8000-000000000005',
    user_id: PLACEHOLDER_USER_ID,
    category: 'prs',
    media_type: 'video' as const,
    caption: '500 lb deadlift — lifetime PR at 165 lb bodyweight',
    thumbnail_url: null,
    status: 'published',
    like_count: 4521,
    comment_count: 318,
    view_count: 62100,
    created_at: '2025-07-24T11:00:00Z',
    author: { username: 'alex_lifts', display_name: 'Alex Lifts' },
  },
  {
    id: '10000000-0000-4000-8000-000000000006',
    user_id: '00000000-0000-4000-8000-000000000003',
    category: 'nutrition',
    media_type: 'video' as const,
    topics: ['nutrition', 'meal_prep'],
    caption: 'High-protein meal prep — 5 days under 30 min',
    thumbnail_url: null,
    status: 'published',
    like_count: 934,
    comment_count: 67,
    view_count: 15800,
    created_at: '2025-07-23T19:30:00Z',
    author: { username: 'macro_mike', display_name: 'Macro Mike' },
  },
  {
    id: '10000000-0000-4000-8000-000000000007',
    user_id: '00000000-0000-4000-8000-000000000002',
    category: 'workouts',
    media_type: 'video' as const,
    topics: ['workouts'],
    caption: 'Leg day finisher — hack squat drop set to failure',
    thumbnail_url: null,
    status: 'published',
    like_count: 891,
    comment_count: 44,
    view_count: 11200,
    created_at: '2025-07-22T14:00:00Z',
    author: { username: 'jade_strong', display_name: 'Jade Strong' },
  },
  {
    id: '10000000-0000-4000-8000-000000000008',
    user_id: PLACEHOLDER_USER_ID,
    category: 'advice',
    media_type: 'text' as const,
    caption: 'How do you fix knee cave on heavy squats?',
    thumbnail_url: null,
    status: 'published',
    like_count: 1567,
    comment_count: 2,
    view_count: 22100,
    created_at: '2025-07-21T10:30:00Z',
    author: { username: 'alex_lifts', display_name: 'Alex Lifts' },
  },
  {
    id: '10000000-0000-4000-8000-000000000009',
    user_id: '00000000-0000-4000-8000-000000000003',
    category: 'advice',
    media_type: 'text' as const,
    caption: 'Favorite creatine brand that actually mixes clean?',
    thumbnail_url: null,
    status: 'published',
    like_count: 743,
    comment_count: 1,
    view_count: 9800,
    created_at: '2025-07-20T08:00:00Z',
    author: { username: 'macro_mike', display_name: 'Macro Mike' },
  },
  {
    id: '10000000-0000-4000-8000-000000000013',
    user_id: '00000000-0000-4000-8000-000000000002',
    category: 'equipment',
    media_type: 'video' as const,
    topics: ['equipment'],
    caption: 'Home gym tour — rack, barbell, and platform setup under $2k',
    thumbnail_url: null,
    status: 'published',
    like_count: 2100,
    comment_count: 142,
    view_count: 34500,
    created_at: '2025-07-19T15:00:00Z',
    author: { username: 'jade_strong', display_name: 'Jade Strong' },
  },
  {
    id: '10000000-0000-4000-8000-000000000014',
    user_id: PLACEHOLDER_USER_ID,
    category: 'nutrition',
    media_type: 'photo' as const,
    topics: ['meal_prep', 'nutrition'],
    caption: 'Sunday meal prep — 12 containers, 200g protein/day',
    photo_uri: null,
    thumbnail_url: null,
    status: 'published',
    like_count: 1180,
    comment_count: 88,
    view_count: 14200,
    created_at: '2025-07-18T11:00:00Z',
    author: { username: 'alex_lifts', display_name: 'Alex Lifts' },
  },
  {
    id: '10000000-0000-4000-8000-000000000015',
    user_id: '00000000-0000-4000-8000-000000000003',
    category: 'equipment',
    media_type: 'photo' as const,
    topics: ['equipment'],
    caption: 'New lever belt + wrist wraps — ready for heavy singles',
    photo_uri: null,
    thumbnail_url: null,
    status: 'published',
    like_count: 756,
    comment_count: 34,
    view_count: 8900,
    created_at: '2025-07-17T09:30:00Z',
    author: { username: 'macro_mike', display_name: 'Macro Mike' },
  },
  {
    id: '10000000-0000-4000-8000-000000000016',
    user_id: PLACEHOLDER_USER_ID,
    category: 'equipment',
    media_type: 'video' as const,
    topics: ['equipment'],
    caption: 'Rogue Ohio bar vs Texas power bar — knurling and whip compared',
    thumbnail_url: null,
    status: 'published',
    like_count: 1430,
    comment_count: 97,
    view_count: 19800,
    created_at: '2025-07-16T14:00:00Z',
    author: { username: 'alex_lifts', display_name: 'Alex Lifts' },
  },
  {
    id: '10000000-0000-4000-8000-000000000017',
    user_id: '00000000-0000-4000-8000-000000000002',
    category: 'equipment',
    media_type: 'photo' as const,
    topics: ['equipment'],
    caption: 'Cable stack + lat pulldown attachment — small gym essentials',
    photo_uri: null,
    thumbnail_url: null,
    status: 'published',
    like_count: 620,
    comment_count: 41,
    view_count: 7600,
    created_at: '2025-07-15T10:00:00Z',
    author: { username: 'jade_strong', display_name: 'Jade Strong' },
  },
];

export const PLACEHOLDER_RECIPE_PHOTOS = [
  {
    id: '10000000-0000-4000-8000-000000000010',
    user_id: '00000000-0000-4000-8000-000000000002',
    category: 'workouts',
    media_type: 'photo' as const,
    caption: 'Post-leg-day pump — 20 set quad session',
    photo_uri: null,
    thumbnail_url: null,
    status: 'published',
    like_count: 640,
    comment_count: 22,
    view_count: 4100,
    created_at: '2025-07-29T12:00:00Z',
    author: { username: 'jade_strong', display_name: 'Jade Strong' },
  },
  {
    id: '10000000-0000-4000-8000-000000000011',
    user_id: PLACEHOLDER_USER_ID,
    category: 'prs',
    media_type: 'photo' as const,
    caption: '315 bench — new PR, 6 months of 5x5',
    photo_uri: null,
    thumbnail_url: null,
    status: 'published',
    like_count: 512,
    comment_count: 18,
    view_count: 3200,
    created_at: '2025-07-28T08:30:00Z',
    author: { username: 'alex_lifts', display_name: 'Alex Lifts' },
  },
  {
    id: '10000000-0000-4000-8000-000000000012',
    user_id: '00000000-0000-4000-8000-000000000003',
    category: 'nutrition',
    media_type: 'photo' as const,
    topics: ['nutrition', 'meal_prep'],
    caption: 'Cut check-in — 12 weeks, 18 lbs down',
    photo_uri: null,
    thumbnail_url: null,
    status: 'published',
    like_count: 890,
    comment_count: 41,
    view_count: 5600,
    created_at: '2025-07-27T17:00:00Z',
    author: { username: 'macro_mike', display_name: 'Macro Mike' },
  },
];

export const PLACEHOLDER_USERS = [
  PLACEHOLDER_PROFILE,
  {
    id: '00000000-0000-4000-8000-000000000002',
    username: 'jade_strong',
    display_name: 'Jade Strong',
    avatar_url: null,
    bio: 'Hybrid athlete · CrossFit + powerlifting',
    follower_count: 8420,
    following_count: 210,
    post_count: 156,
  },
  {
    id: '00000000-0000-4000-8000-000000000003',
    username: 'macro_mike',
    display_name: 'Macro Mike',
    avatar_url: null,
    bio: 'Nutrition coach · cut/bulk breakdowns',
    follower_count: 3200,
    following_count: 89,
    post_count: 72,
  },
];

export const PLACEHOLDER_NOTIFICATIONS = [
  {
    id: '40000000-0000-4000-8000-000000000001',
    type: 'like',
    title: 'jade_strong liked your video',
    body: '405 lb squat PR — 3 months of block training',
    read: false,
    created_at: '2025-07-30T14:00:00Z',
  },
  {
    id: '40000000-0000-4000-8000-000000000002',
    type: 'follow',
    title: 'macro_mike started following you',
    body: null,
    read: false,
    created_at: '2025-07-30T12:30:00Z',
  },
  {
    id: '40000000-0000-4000-8000-000000000003',
    type: 'comment',
    title: 'jade_strong commented on your PR',
    body: 'Insane pull — what program are you running?',
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
