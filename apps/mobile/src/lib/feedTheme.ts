import { FeedLaneId } from '../constants/categories';

export interface FeedTheme {
  accent: string;
  accentSoft: string;
  glow: string;
  ambientA: string;
  ambientB: string;
}

const LANE_THEMES: Record<FeedLaneId, FeedTheme> = {
  main_feed: {
    accent: '#E63946',
    accentSoft: 'rgba(230,57,70,0.35)',
    glow: 'rgba(230,57,70,0.22)',
    ambientA: 'rgba(230,57,70,0.18)',
    ambientB: 'rgba(120,20,30,0.35)',
  },
  workouts: {
    accent: '#FF6B35',
    accentSoft: 'rgba(255,107,53,0.35)',
    glow: 'rgba(255,107,53,0.2)',
    ambientA: 'rgba(255,107,53,0.16)',
    ambientB: 'rgba(80,30,10,0.4)',
  },
  equipment: {
    accent: '#94A3B8',
    accentSoft: 'rgba(148,163,184,0.35)',
    glow: 'rgba(148,163,184,0.22)',
    ambientA: 'rgba(148,163,184,0.16)',
    ambientB: 'rgba(30,40,55,0.42)',
  },
  nutrition: {
    accent: '#2ECC71',
    accentSoft: 'rgba(46,204,113,0.3)',
    glow: 'rgba(46,204,113,0.18)',
    ambientA: 'rgba(46,204,113,0.14)',
    ambientB: 'rgba(10,60,30,0.38)',
  },
  prs: {
    accent: '#F4C430',
    accentSoft: 'rgba(244,196,48,0.32)',
    glow: 'rgba(244,196,48,0.2)',
    ambientA: 'rgba(244,196,48,0.15)',
    ambientB: 'rgba(60,50,10,0.38)',
  },
  advice: {
    accent: '#38BDF8',
    accentSoft: 'rgba(56,189,248,0.3)',
    glow: 'rgba(56,189,248,0.18)',
    ambientA: 'rgba(56,189,248,0.14)',
    ambientB: 'rgba(10,40,70,0.4)',
  },
  form: {
    accent: '#A855F7',
    accentSoft: 'rgba(168,85,247,0.32)',
    glow: 'rgba(168,85,247,0.2)',
    ambientA: 'rgba(168,85,247,0.16)',
    ambientB: 'rgba(40,10,70,0.4)',
  },
  community: {
    accent: '#38BDF8',
    accentSoft: 'rgba(56,189,248,0.3)',
    glow: 'rgba(56,189,248,0.18)',
    ambientA: 'rgba(56,189,248,0.14)',
    ambientB: 'rgba(10,40,70,0.4)',
  },
};

const CATEGORY_ACCENTS: Record<string, string> = {
  workouts: '#FF6B35',
  equipment: '#94A3B8',
  nutrition: '#2ECC71',
  prs: '#F4C430',
  advice: '#38BDF8',
  meal_prep: '#2ECC71',
};

export function withAlpha(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  if (h.length !== 6) return hex;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function getLaneTheme(laneId: FeedLaneId): FeedTheme {
  return LANE_THEMES[laneId] ?? LANE_THEMES.main_feed;
}

export function getCategoryAccent(category?: string | null): string {
  return CATEGORY_ACCENTS[category ?? ''] ?? '#E63946';
}

export function getCategoryAccentSoft(category?: string | null): string {
  const map: Record<string, string> = {
    workouts: 'rgba(255,107,53,0.35)',
    equipment: 'rgba(148,163,184,0.35)',
    nutrition: 'rgba(46,204,113,0.3)',
    prs: 'rgba(244,196,48,0.32)',
    advice: 'rgba(56,189,248,0.3)',
  };
  return map[category ?? ''] ?? 'rgba(230,57,70,0.35)';
}

export function getCategoryAccentBorder(category?: string | null): string {
  const map: Record<string, string> = {
    workouts: 'rgba(255,107,53,0.45)',
    equipment: 'rgba(148,163,184,0.42)',
    nutrition: 'rgba(46,204,113,0.4)',
    prs: 'rgba(244,196,48,0.42)',
    advice: 'rgba(56,189,248,0.4)',
  };
  return map[category ?? ''] ?? 'rgba(230,57,70,0.45)';
}

export function mixPointer(base: number, pointer: number, amount = 0.18): number {
  return base + (pointer - 0.5) * amount;
}

export function webAmbientStyle(theme: FeedTheme, pointer: { x: number; y: number }) {
  const x1 = mixPointer(28, pointer.x, 24);
  const y1 = mixPointer(18, pointer.y, 16);
  const x2 = mixPointer(72, pointer.x, 20);
  const y2 = mixPointer(68, pointer.y, 18);
  return {
    backgroundColor: '#030303',
    backgroundImage: [
      `radial-gradient(ellipse 55% 45% at ${x1}% ${y1}%, ${theme.ambientA} 0%, transparent 70%)`,
      `radial-gradient(ellipse 50% 40% at ${x2}% ${y2}%, ${theme.ambientB} 0%, transparent 65%)`,
      'radial-gradient(ellipse 80% 60% at 50% 100%, rgba(0,0,0,0.85) 0%, transparent 55%)',
    ].join(', '),
  };
}

export function webScrimStyle(accent: string) {
  return {
    backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.94) 0%, rgba(0,0,0,0.55) 40%, transparent 100%), linear-gradient(135deg, ${accent}18 0%, transparent 45%)`,
  };
}
