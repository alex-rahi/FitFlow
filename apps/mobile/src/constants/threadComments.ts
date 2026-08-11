export interface ThreadComment {
  id: string;
  post_id: string;
  parent_id?: string | null;
  content: string;
  like_count: number;
  created_at: string;
  author?: { username?: string; display_name?: string };
}

export const PLACEHOLDER_THREAD_COMMENTS: ThreadComment[] = [
  {
    id: '50000000-0000-4000-8000-000000000001',
    post_id: '10000000-0000-4000-8000-000000000004',
    parent_id: null,
    content: 'Plain Greek yogurt works great — add a little lemon and garlic powder.',
    like_count: 89,
    created_at: '2025-07-25T15:00:00Z',
    author: { username: 'macro_mike', display_name: 'Macro Mike' },
  },
  {
    id: '50000000-0000-4000-8000-000000000002',
    post_id: '10000000-0000-4000-8000-000000000004',
    parent_id: null,
    content: 'Do you drain the yogurt first or use it straight from the tub?',
    like_count: 34,
    created_at: '2025-07-25T15:15:00Z',
    author: { username: 'jade_kitchen', display_name: 'Jade Kitchen' },
  },
  {
    id: '50000000-0000-4000-8000-000000000003',
    post_id: '10000000-0000-4000-8000-000000000004',
    parent_id: '50000000-0000-4000-8000-000000000002',
    content: 'Strain it for 30 min — thicker dip, less watery.',
    like_count: 21,
    created_at: '2025-07-25T15:30:00Z',
    author: { username: 'alex_cooks', display_name: 'Alex Cooks' },
  },
  {
    id: '50000000-0000-4000-8000-000000000004',
    post_id: '10000000-0000-4000-8000-000000000008',
    parent_id: null,
    content: 'Brine the breast for 20 min, then cook to 155°F and rest — stays juicy.',
    like_count: 124,
    created_at: '2025-07-21T08:30:00Z',
    author: { username: 'jade_kitchen', display_name: 'Jade Kitchen' },
  },
  {
    id: '50000000-0000-4000-8000-000000000005',
    post_id: '10000000-0000-4000-8000-000000000008',
    parent_id: null,
    content: 'Adding a splash of broth when reheating helps too.',
    like_count: 67,
    created_at: '2025-07-21T09:30:00Z',
    author: { username: 'alex_cooks', display_name: 'Alex Cooks' },
  },
  {
    id: '50000000-0000-4000-8000-000000000006',
    post_id: '10000000-0000-4000-8000-000000000009',
    parent_id: null,
    content: 'Canned tuna, eggs, and frozen veg — always in my cart.',
    like_count: 45,
    created_at: '2025-07-20T09:00:00Z',
    author: { username: 'jade_kitchen', display_name: 'Jade Kitchen' },
  },
];

export function getCommentsForPost(postId: string): ThreadComment[] {
  return PLACEHOLDER_THREAD_COMMENTS.filter((c) => c.post_id === postId);
}
