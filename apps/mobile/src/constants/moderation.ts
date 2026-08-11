export interface ModerationStep {
  id: string;
  label: string;
  detail: string;
}

export const YOLO_MODERATION_STEPS: ModerationStep[] = [
  { id: 'upload', label: 'Upload received', detail: 'Media stored for processing' },
  { id: 'frames', label: 'Frame / image analysis', detail: 'Gym scenes sampled for review' },
  { id: 'yolo', label: 'YOLO detection', detail: 'People and equipment tagged (free local model)' },
  { id: 'moderation', label: 'Safety scoring', detail: 'Free heuristics flag gray-zone content' },
  { id: 'publish', label: 'Decision', detail: 'Clear pass → live; flagged → human review in admin' },
];

export type ModerationPhase = 'uploading' | 'processing' | 'published' | 'rejected' | 'pending_review';

export function getModerationPhase(status?: string | null, decision?: string | null): ModerationPhase {
  if (status === 'published' || decision === 'publish') return 'published';
  if (status === 'rejected' || decision === 'reject') return 'rejected';
  if (status === 'pending_review' || decision === 'flag_for_review' || decision === 'manual_review') {
    return 'pending_review';
  }
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
