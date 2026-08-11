export interface ModerationStep {
  id: string;
  label: string;
  detail: string;
}

export const YOLO_MODERATION_STEPS: ModerationStep[] = [
  { id: 'upload', label: 'Upload received', detail: 'Recipe media stored securely' },
  { id: 'frames', label: 'Frame / image analysis', detail: 'Food and kitchen scenes sampled for review' },
  { id: 'yolo', label: 'YOLO detection', detail: 'Ingredients, dishes, and prep steps tagged' },
  { id: 'moderation', label: 'Content moderation', detail: 'Safety scores evaluated by rules engine' },
  { id: 'publish', label: 'Auto-publish', detail: 'Passed checks — live on Recipes, Watch, or Kitchen' },
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
