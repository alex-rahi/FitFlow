import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session } from '@supabase/supabase-js';
import { isDemoMode } from '../constants/theme';
import { createPlaceholderSession } from '../lib/placeholders';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  session: Session | null;
  loading: boolean;
  isPlaceholder: boolean;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  resendVerification: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const demoMode = isDemoMode();

  useEffect(() => {
    if (demoMode) {
      setSession(createPlaceholderSession('demo@recipetok.app'));
      setLoading(false);
      return;
    }

    supabase.auth.getSession()
      .then(({ data }) => {
        setSession(data.session);
      })
      .catch(() => setSession(null))
      .finally(() => setLoading(false));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => subscription.unsubscribe();
  }, [demoMode]);

  const signUp = async (email: string, password: string, username: string) => {
    if (demoMode) {
      const s = createPlaceholderSession(email);
      s.user.user_metadata = { username, display_name: username };
      setSession(s);
      return;
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username, display_name: username } },
    });
    if (error) throw error;
    if (data.session) setSession(data.session);
  };

  const signIn = async (email: string, password: string) => {
    if (demoMode) {
      setSession(createPlaceholderSession(email));
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    if (demoMode) {
      setSession(null);
      return;
    }
    await supabase.auth.signOut();
  };

  const resetPassword = async (email: string) => {
    if (demoMode) {
      await new Promise((r) => setTimeout(r, 800));
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'gymtok://reset-password',
    });
    if (error) throw error;
  };

  const resendVerification = async (email: string) => {
    if (demoMode) {
      await new Promise((r) => setTimeout(r, 500));
      return;
    }
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{
      session, loading, isPlaceholder: demoMode,
      signUp, signIn, signOut, resetPassword, resendVerification,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
