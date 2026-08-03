'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useCartStore } from '@/lib/store/useCartStore';

export type UserRole = 'customer' | 'admin';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
}

interface AuthContextType {
  user: AuthUser | null;
  role: UserRole;
  isLoggedIn: boolean;
  login: (email: string, password?: string) => Promise<boolean>;
  register: (email: string, password?: string, fullName?: string) => Promise<boolean>;
  logout: () => void;
  resetPassword: (email: string) => Promise<boolean>;
  isHydrated: boolean;
}

const AUTH_STORAGE_KEY = 'proteinshop_auth_session';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // 1. Check local session cache
    try {
      const savedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
      if (savedAuth) {
        const parsed = JSON.parse(savedAuth);
        if (parsed && parsed.id && parsed.email) {
          // Ignore legacy mock IDs
          if (parsed.id === 'user_customer_01' || parsed.id === 'user_admin_01') {
            localStorage.removeItem(AUTH_STORAGE_KEY);
            setUser(null);
          } else {
            setUser(parsed);
          }
        }
      }
    } catch {
      // Storage unavailable
    } finally {
      setIsHydrated(true);
    }

    // 2. Listen for live Supabase Auth session changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        const role: UserRole = (profile?.role === 'admin') ? 'admin' : 'customer';
        const authUser: AuthUser = {
          id: session.user.id,
          email: session.user.email || '',
          fullName: profile?.full_name || session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
          role,
        };
        saveUserSession(authUser);
      } else if (event === 'SIGNED_OUT') {
        saveUserSession(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const saveUserSession = (newUser: AuthUser | null) => {
    setUser(newUser);
    try {
      if (newUser) {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUser));
      } else {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    } catch {
      // Storage unavailable
    }
  };

  const login = async (email: string, password?: string): Promise<boolean> => {
    if (!email || !password) {
      throw new Error('Email and password are required');
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      throw new Error(error?.message || 'Login failed');
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    const role: UserRole = (profile?.role === 'admin') ? 'admin' : 'customer';
    const authUser: AuthUser = {
      id: data.user.id,
      email: data.user.email || email,
      fullName: profile?.full_name || data.user.user_metadata?.full_name || email.split('@')[0],
      role,
    };
    saveUserSession(authUser);
    return true;
  };

  const register = async (email: string, password?: string, fullName?: string): Promise<boolean> => {
    if (!email || !password) {
      throw new Error('Email and password are required');
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || email.split('@')[0],
        },
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    if (data.user) {
      const authUser: AuthUser = {
        id: data.user.id,
        email: data.user.email || email,
        fullName: fullName || email.split('@')[0],
        role: 'customer',
      };
      saveUserSession(authUser);
      return true;
    }
    return false;
  };

  const logout = async () => {
    await supabase.auth.signOut().catch(() => null);
    saveUserSession(null);
    useCartStore.getState().clearCart();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('bioluxe_cart');
      sessionStorage.clear();
    }
  };

  const resetPassword = async (email: string): Promise<boolean> => {
    if (!email || !email.includes('@')) {
      throw new Error('Valid email address is required');
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/login` : undefined,
    });
    if (error) {
      throw new Error(error.message);
    }
    return true;
  };

  const currentRole: UserRole = user?.role || 'customer';
  const isLoggedIn = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        role: currentRole,
        isLoggedIn,
        login,
        register,
        logout,
        resetPassword,
        isHydrated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
