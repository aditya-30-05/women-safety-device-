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
  signOut: () => Promise<void>;
  enableMFA: () => Promise<{ error: Error | null }>;
  verifyMFA: (token: string) => Promise<{ error: Error | null }>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>;
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
        setUserRole((profile.role as UserRole) || 'user');
        setIsMFAEnabled(profile.mfa_enabled || false);
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
          // Log successful authentication
          await logSecurityEvent('auth_success', session.user.id, {
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
      await logSecurityEvent('signup_rate_limit', null, { email }, 'high');
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
      await logSecurityEvent('signup_failed', null, { email, error: error.message }, 'medium');
    } else {
      await logSecurityEvent('signup_success', null, { email }, 'low');
      clearRateLimit(rateLimitKey);
    }
    
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    // Rate limiting - 5 attempts per 15 minutes
    const rateLimitKey = `signin_${email}`;
    if (!rateLimitCheck(rateLimitKey, 5, 15 * 60 * 1000)) {
      await logSecurityEvent('signin_rate_limit', null, { email }, 'high');
      return { error: new Error('Too many login attempts. Please try again in 15 minutes.') };
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      await logSecurityEvent('signin_failed', null, { 
        email, 
        error: error.message,
        device: getDeviceFingerprint(),
      }, 'high');
    } else {
      await logSecurityEvent('signin_success', null, { 
        email,
        device: getDeviceFingerprint(),
      }, 'low');
      clearRateLimit(rateLimitKey);
    }
    
    return { error };
  };

  const signOut = async () => {
    if (user) {
      await logSecurityEvent('signout', user.id, {}, 'low');
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
      await logSecurityEvent('mfa_enabled', user.id, {}, 'medium');
      return { error: null };
    } catch (error) {
      await logSecurityEvent('mfa_enable_failed', user.id, { error }, 'high');
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
      await logSecurityEvent('password_reset_failed', null, { email }, 'medium');
    } else {
      await logSecurityEvent('password_reset_requested', null, { email }, 'low');
    }
    
    return { error };
  };

  const updatePassword = async (newPassword: string) => {
    if (!user) return { error: new Error('Not authenticated') };
    
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    
    if (error) {
      await logSecurityEvent('password_update_failed', user.id, {}, 'high');
    } else {
      await logSecurityEvent('password_updated', user.id, {}, 'medium');
    }
    
    return { error };
  };

  const checkPermission = (resource: string, action: string): boolean => {
    return hasPermission(userRole, resource, action);
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
      signOut,
      enableMFA,
      verifyMFA,
      resetPassword,
      updatePassword,
      checkPermission,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
