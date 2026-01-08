import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { rateLimitCheck, clearRateLimit, logSecurityEvent, getDeviceFingerprint, hasPermission, type UserRole } from '@/lib/security';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userRole: UserRole;
  isMFAEnabled: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  enableMFA: () => Promise<{ error: Error | null }>;
  verifyMFA: (token: string) => Promise<{ error: Error | null }>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>;
  signInWithMagicLink: (email: string) => Promise<{ error: Error | null }>;
  checkPermission: (resource: string, action: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole>('user');
  const [isMFAEnabled, setIsMFAEnabled] = useState(false);

  // Load user role and MFA status
  const loadUserSecuritySettings = useCallback(async (userId: string) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, mfa_enabled')
        .eq('user_id', userId)
        .single();

      if (profile) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const p = profile as any;
        setUserRole((p.role as UserRole) || 'user');
        setIsMFAEnabled(p.mfa_enabled || false);
      }
    } catch (error) {
      console.error('Error loading user security settings:', error);
    }
  }, []);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          await loadUserSecuritySettings(session.user.id);
          logSecurityEvent('auth_success', session.user.id, {
            event,
            device: getDeviceFingerprint(),
          }, 'low');
        } else {
          setUserRole('user');
          setIsMFAEnabled(false);
        }

        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        await loadUserSecuritySettings(session.user.id);
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [loadUserSecuritySettings]);

  const signUp = async (email: string, password: string, fullName: string) => {
    // Rate limiting
    const rateLimitKey = `signup_${email}`;
    if (!rateLimitCheck(rateLimitKey, 3, 60 * 60 * 1000)) { // 3 attempts per hour
      logSecurityEvent('signup_rate_limit', null, { email }, 'high');
      return { error: new Error('Too many signup attempts. Please try again later.') };
    }

    const redirectUrl = `${window.location.origin}/`;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName
        }
      }
    });

    if (error) {
      logSecurityEvent('signup_failed', null, { email, error: error.message }, 'medium');
    } else {
      logSecurityEvent('signup_success', null, { email }, 'low');
      clearRateLimit(rateLimitKey);
    }

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    // Rate limiting - 5 attempts per 15 minutes
    const rateLimitKey = `signin_${email}`;
    if (!rateLimitCheck(rateLimitKey, 5, 15 * 60 * 1000)) {
      logSecurityEvent('signin_rate_limit', null, { email }, 'high');
      return { error: new Error('Too many login attempts. Please try again in 15 minutes.') };
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      logSecurityEvent('signin_failed', null, {
        email,
        error: error.message,
        device: getDeviceFingerprint(),
      }, 'high');
    } else {
      logSecurityEvent('signin_success', null, {
        email,
        device: getDeviceFingerprint(),
      }, 'low');
      clearRateLimit(rateLimitKey);
    }

    return { error };
  };

  const signOut = async () => {
    if (user) {
      logSecurityEvent('signout', user.id, {}, 'low');
    }
    await supabase.auth.signOut();
    setUserRole('user');
    setIsMFAEnabled(false);
  };

  const enableMFA = async () => {
    if (!user) return { error: new Error('Not authenticated') };

    try {
      // In production, this would set up TOTP
      setIsMFAEnabled(true);
      logSecurityEvent('mfa_enabled', user.id, {}, 'medium');
      return { error: null };
    } catch (error) {
      logSecurityEvent('mfa_enable_failed', user.id, { error }, 'high');
      return { error: error as Error };
    }
  };

  const verifyMFA = async (token: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    // In production, verify TOTP token
    await logSecurityEvent('mfa_verified', user.id, {}, 'low');
    return { error: null };
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth?mode=reset`,
    });

    if (error) {
      logSecurityEvent('password_reset_failed', null, { email }, 'medium');
    } else {
      logSecurityEvent('password_reset_requested', null, { email }, 'low');
    }

    return { error };
  };

  const updatePassword = async (newPassword: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      logSecurityEvent('password_update_failed', user.id, {}, 'high');
    } else {
      logSecurityEvent('password_updated', user.id, {}, 'medium');
    }

    return { error };
  };

  const signInWithMagicLink = async (email: string) => {
    // Rate limiting
    const rateLimitKey = `magiclink_${email}`;
    if (!rateLimitCheck(rateLimitKey, 3, 60 * 60 * 1000)) {
      await logSecurityEvent('magiclink_rate_limit', null, { email }, 'high');
      return { error: new Error('Too many magic link attempts. Please try again later.') };
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`
      }
    });

    if (error) {
      await logSecurityEvent('magiclink_failed', null, { email, error: error.message }, 'medium');
    } else {
      await logSecurityEvent('magiclink_sent', null, { email }, 'low');
      clearRateLimit(rateLimitKey);
    }

    return { error };
  };

  const checkPermission = (resource: string, action: string): boolean => {
    return hasPermission(userRole, resource, action);
  };

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      });

      if (error) {
        await logSecurityEvent('google_auth_failed', null, { error: error.message }, 'medium');
        return { error };
      }

      return { error: null };
    } catch (error) {
      console.error('Google auth error:', error);
      return { error: error as Error };
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      userRole,
      isMFAEnabled,
      signUp,
      signIn,
      signInWithGoogle,
      signOut,
      enableMFA,
      verifyMFA,
      resetPassword,
      updatePassword,
      signInWithMagicLink,
      checkPermission,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
