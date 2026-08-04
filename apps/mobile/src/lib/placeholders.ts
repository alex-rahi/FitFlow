import { Session } from '@supabase/supabase-js';
import { PLACEHOLDER_USER_ID } from '../constants/theme';

export function createPlaceholderSession(email: string): Session {
  return {
    access_token: 'placeholder-access-token',
    refresh_token: 'placeholder-refresh-token',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: 'bearer',
    user: {
      id: PLACEHOLDER_USER_ID,
      aud: 'authenticated',
      role: 'authenticated',
      email,
      email_confirmed_at: new Date().toISOString(),
      phone: '',
      confirmed_at: new Date().toISOString(),
      last_sign_in_at: new Date().toISOString(),
      app_metadata: { provider: 'email', providers: ['email'] },
      user_metadata: { username: email.split('@')[0] },
      identities: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_anonymous: false,
    },
  } as Session;
}

export const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
