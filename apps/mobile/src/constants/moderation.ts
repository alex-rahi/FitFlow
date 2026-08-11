export interface ModerationStep {
  id: string;
  label: string;
  detail: string;
}

export const YOLO_MODERATION_STEPS: ModerationStep[] = [
  { id: 'upload', label: 'Upload received', detail: 'Media stored in Supabase Storage' },
  { id: 'frames', label: 'Frame / image analysis', detail: 'Keyframes or photo sampled for YOLO' },
  { id: 'yolo', label: 'YOLO detection', detail: 'Person, equipment, food, and movement tags' },
  { id: 'moderation', label: 'Content moderation', detail: 'Safety scores evaluated by rules engine' },
  { id: 'publish', label: 'Auto-publish', detail: 'Passed YOLO checks — live immediately, no manual review' },
];

export type ModerationPhase = 'uploading' | 'processing' | 'published' | 'rejected';

export function getModerationPhase(status?: string | null, decision?: string | null): ModerationPhase {
  if (status === 'published' || decision === 'publish') return 'published';
  if (status === 'rejected' || decision === 'reject') return 'rejected';
  if (status === 'processing' || status === 'approved') return 'processing';
  return 'uploading';
}

export function getActiveStepIndex(phase: ModerationPhase): number {
  switch (phase) {
    case 'uploading':
      return 0;
    case 'processing':
      return 2;
    case 'published':
      return 4;
    case 'rejected':
      return 3;
    default:
      return 0;
  }
}
