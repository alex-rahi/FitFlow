import { supabase } from './supabase';
import { USE_PLACEHOLDERS } from '../constants/theme';

const RAW_BUCKET = 'raw-uploads';
const PROCESSED_BUCKET = 'processed-videos';

interface PlaybackPost {
  raw_video_url?: string | null;
  processed_video_url?: string | null;
}

export async function resolvePlaybackUrl(post: PlaybackPost): Promise<string | null> {
  if (USE_PLACEHOLDERS) return null;

  const processed = post.processed_video_url;
  if (processed?.startsWith('http')) return processed;

  const raw = post.raw_video_url;
  if (raw?.startsWith('http')) return raw;

  if (processed) {
    const { data, error } = await supabase.storage
      .from(PROCESSED_BUCKET)
      .createSignedUrl(processed, 3600);
    if (!error && data?.signedUrl) return data.signedUrl;
  }

  if (raw) {
    const { data, error } = await supabase.storage
      .from(RAW_BUCKET)
      .createSignedUrl(raw, 3600);
    if (!error && data?.signedUrl) return data.signedUrl;
  }

  return null;
}
