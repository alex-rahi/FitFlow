export interface ModerationStep {
  id: string;
  label: string;
  detail: string;
}

export const YOLO_MODERATION_STEPS: ModerationStep[] = [
  { id: 'upload', label: 'Upload received', detail: 'Video stored in Supabase Storage' },
  { id: 'frames', label: 'Frame extraction', detail: 'Keyframes sampled for analysis' },
  { id: 'yolo', label: 'YOLO detection', detail: 'Person, equipment, and movement tags' },
  { id: 'moderation', label: 'Content moderation', detail: 'Safety scores evaluated by rules engine' },
  { id: 'publish', label: 'Feed publish', detail: 'Approved posts enter Feed / Recipes / Community' },
];

export type ModerationPhase = 'uploading' | 'processing' | 'pending_review' | 'published' | 'rejected';

export function getModerationPhase(status?: string | null, decision?: string | null): ModerationPhase {
  if (status === 'published') return 'published';
  if (status === 'rejected' || decision === 'reject') return 'rejected';
  if (status === 'pending_review' || decision === 'flag_for_review') return 'pending_review';
  if (status === 'processing' || status === 'approved') return 'processing';
  return 'uploading';
}

export function getActiveStepIndex(phase: ModerationPhase): number {
  switch (phase) {
    case 'uploading':
      return 0;
    case 'processing':
      return 2;
    case 'pending_review':
      return 3;
    case 'published':
      return 4;
    case 'rejected':
      return 3;
    default:
      return 0;
  }
}
