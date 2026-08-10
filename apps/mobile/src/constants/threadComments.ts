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
    content: 'The bracing cue fixed my lower back rounding — game changer.',
    like_count: 89,
    created_at: '2025-07-25T15:00:00Z',
    author: { username: 'bench_king', display_name: 'Bench King' },
  },
  {
    id: '50000000-0000-4000-8000-000000000002',
    post_id: '10000000-0000-4000-8000-000000000004',
    parent_id: null,
    content: 'Should the bar touch shins at setup or stay an inch out?',
    like_count: 34,
    created_at: '2025-07-25T15:15:00Z',
    author: { username: 'fitness_jade', display_name: 'Jade Fitness' },
  },
  {
    id: '50000000-0000-4000-8000-000000000003',
    post_id: '10000000-0000-4000-8000-000000000004',
    parent_id: '50000000-0000-4000-8000-000000000002',
    content: 'Light contact at the shin — drag the bar up your legs on the way up.',
    like_count: 21,
    created_at: '2025-07-25T15:30:00Z',
    author: { username: 'alex_lifts', display_name: 'Alex Lifts' },
  },
  {
    id: '50000000-0000-4000-8000-000000000004',
    post_id: '10000000-0000-4000-8000-000000000008',
    parent_id: null,
    content: 'Depth check: hip crease below knee cap. Film from the side.',
    like_count: 124,
    created_at: '2025-07-21T08:30:00Z',
    author: { username: 'fitness_jade', display_name: 'Jade Fitness' },
  },
  {
    id: '50000000-0000-4000-8000-000000000005',
    post_id: '10000000-0000-4000-8000-000000000008',
    parent_id: null,
    content: 'Adding a pause at the bottom helped me stay consistent.',
    like_count: 67,
    created_at: '2025-07-21T09:30:00Z',
    author: { username: 'alex_lifts', display_name: 'Alex Lifts' },
  },
  {
    id: '50000000-0000-4000-8000-000000000006',
    post_id: '10000000-0000-4000-8000-000000000009',
    parent_id: null,
    content: '7–9 hrs sleep made more difference than any supplement stack.',
    like_count: 201,
    created_at: '2025-07-20T05:00:00Z',
    author: { username: 'fitness_jade', display_name: 'Jade Fitness' },
  },
];

export function getCommentsForPost(postId: string): ThreadComment[] {
  return PLACEHOLDER_THREAD_COMMENTS
    .filter((c) => c.post_id === postId)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
}

export function getTopLevelComments(postId: string): ThreadComment[] {
  return getCommentsForPost(postId).filter((c) => !c.parent_id);
}

export function getNestedReplies(postId: string, parentId: string): ThreadComment[] {
  return getCommentsForPost(postId).filter((c) => c.parent_id === parentId);
}
