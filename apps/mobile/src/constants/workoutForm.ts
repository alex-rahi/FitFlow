export interface WorkoutFormEntry {
  exercise: string;
  sets: string;
  reps: string;
  weight?: string;
}

export interface WorkoutFormData {
  title: string;
  entries: WorkoutFormEntry[];
  notes?: string;
}

export const FORM_UPLOAD_DISCLAIMER = {
  title: 'Before you log',
  body:
    'Workout forms are public and visible in the Form feed. Do not include medical info, private data, or form-check video — use Video for that. Logs are reviewed by our moderation pipeline.',
  checkbox: 'I understand and agree to share this workout log',
};

export function formatWorkoutSet(entry: WorkoutFormEntry): string {
  const load = entry.weight?.trim() ? ` @ ${entry.weight.trim()}` : '';
  return `${entry.sets}×${entry.reps}${load}`;
}

export function summarizeWorkoutForm(form: WorkoutFormData): string {
  const lines = form.entries.map((e) => `${e.exercise} — ${formatWorkoutSet(e)}`);
  return [form.title, ...lines, form.notes].filter(Boolean).join('\n');
}
