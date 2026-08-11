import AsyncStorage from '@react-native-async-storage/async-storage';
import { ContentTopic, getPostTopics, laneToTopics, TOPIC_LABELS, TopicPost } from './contentTopics';

const STORAGE_KEY = '@gymtok/user_interests';
const MAX_SCORE = 100;

export type InterestSignal =
  | 'impression'
  | 'dwell'
  | 'like'
  | 'comment'
  | 'lane_visit';

const SIGNAL_WEIGHTS: Record<InterestSignal, number> = {
  impression: 0.45,
  dwell: 0.9,
  like: 2.8,
  comment: 1.6,
  lane_visit: 1.1,
};

export type InterestScores = Partial<Record<ContentTopic, number>>;

type Listener = (scores: InterestScores) => void;

let scores: InterestScores = {};
let loaded = false;
let saveTimer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<Listener>();

async function persist() {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
  } catch {
    // ignore storage failures
  }
}

function schedulePersist() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveTimer = null;
    persist();
  }, 400);
}

function clampScore(value: number): number {
  return Math.min(MAX_SCORE, Math.max(0, value));
}

function bumpTopics(topics: ContentTopic[], signal: InterestSignal) {
  const delta = SIGNAL_WEIGHTS[signal];
  let changed = false;
  for (const topic of topics) {
    const next = clampScore((scores[topic] ?? 0) + delta);
    if (next !== scores[topic]) {
      scores[topic] = next;
      changed = true;
    }
  }
  if (changed) {
    schedulePersist();
    listeners.forEach((fn) => fn({ ...scores }));
  }
}

export async function loadUserInterests(): Promise<InterestScores> {
  if (loaded) return { ...scores };
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) scores = JSON.parse(raw) as InterestScores;
  } catch {
    scores = {};
  }
  loaded = true;
  return { ...scores };
}

export function getInterestScores(): InterestScores {
  return { ...scores };
}

export function subscribeInterests(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function recordInterestSignal(
  signal: InterestSignal,
  topics: ContentTopic[],
) {
  if (topics.length === 0) return;
  bumpTopics(topics, signal);
}

export function recordPostSignal(signal: InterestSignal, post: TopicPost) {
  recordInterestSignal(signal, getPostTopics(post));
}

export function recordLaneVisit(laneId: string) {
  recordInterestSignal('lane_visit', laneToTopics(laneId));
}

export function getTopInterests(limit = 3): { topic: ContentTopic; score: number; label: string }[] {
  return Object.entries(scores)
    .filter(([, v]) => (v ?? 0) > 0.5)
    .sort(([, a], [, b]) => (b ?? 0) - (a ?? 0))
    .slice(0, limit)
    .map(([topic, score]) => ({
      topic: topic as ContentTopic,
      score: score ?? 0,
      label: TOPIC_LABELS[topic as ContentTopic],
    }));
}

export async function resetUserInterests() {
  scores = {};
  loaded = true;
  await AsyncStorage.removeItem(STORAGE_KEY);
  listeners.forEach((fn) => fn({}));
}
