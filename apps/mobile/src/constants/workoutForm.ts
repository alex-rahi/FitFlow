/** Metadata for a workout form-check post (technique video + cues). */

export interface WorkoutFormData {
  exercise: string;
  focus_points: string[];
  notes?: string;
  request_feedback?: boolean;
}

export const FORM_UPLOAD_DISCLAIMER = {
  title: 'Before you post',
  body:
    'Form-check clips are public and appear in the Form feed. Share technique video only — community feedback may include critical cues. Do not post private or medical information.',
  liability:
    'We are not responsible for injuries, accidents, or damages resulting from workouts, techniques, or equipment shown.',
  checkbox: 'I understand and want form feedback on this clip',
};

export function parseFocusPoints(text: string): string[] {
  return text
    .split(/[\n,]+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export function formCheckCaption(form: WorkoutFormData): string {
  return `${form.exercise} — form check`;
}
