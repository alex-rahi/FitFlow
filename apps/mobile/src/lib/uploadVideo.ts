import { supabase } from './supabase';
import { delay } from './placeholders';
import { isDemoMode } from '../constants/theme';

const RAW_UPLOADS_BUCKET = 'raw-uploads';

export async function uploadVideoFile(storagePath: string, videoUri: string): Promise<void> {
  if (isDemoMode()) {
    await delay(600);
    return;
  }

  const response = await fetch(videoUri);
  if (!response.ok) {
    throw new Error('Could not read the selected video file');
  }
  const blob = await response.blob();

  const { error } = await supabase.storage
    .from(RAW_UPLOADS_BUCKET)
    .upload(storagePath, blob, { contentType: 'video/mp4', upsert: true });

  if (error) {
    throw new Error(error.message || 'Video upload to storage failed');
  }
}
