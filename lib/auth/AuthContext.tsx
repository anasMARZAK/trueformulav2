'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase/client';

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
  switchRole: (role: UserRole) => void;
  isHydrated: boolean;
}

const AUTH_STORAGE_KEY = 'proteinshop_auth_session';

const DEFAULT_CUSTOMER_USER: AuthUser = {
  id: 'user_customer_01',
  email: 'customer@example.com',
  fullName: 'Jane Doe',
  role: 'customer',
};

const DEFAULT_ADMIN_USER: AuthUser = {
  id: 'user_admin_01',
  email: 'admin@proteinshop.com',
  fullName: 'Store Admin',
  role: 'admin',
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(DEFAULT_CUSTOMER_USER);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // 1. Check local session cache
    try {
      const savedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
      if (savedAuth) {
        const parsed = JSON.parse(savedAuth);
        if (parsed && parsed.email) {
          setUser(parsed);
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

        const role: UserRole = profile?.role || (session.user.email?.includes('admin') ? 'admin' : 'customer');
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
    if (password) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        throw new Error(error.message);
      }

      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        const role: UserRole = profile?.role || (email.includes('admin') ? 'admin' : 'customer');
        const authUser: AuthUser = {
          id: data.user.id,
          email: data.user.email || email,
          fullName: profile?.full_name || data.user.user_metadata?.full_name || email.split('@')[0],
          role,
        };
        saveUserSession(authUser);
        return true;
      }
    }

    // Fallback Mock Authentication if no password
    const isTargetAdmin = email.toLowerCase().includes('admin');
    const authUser: AuthUser = isTargetAdmin
      ? {
          id: 'user_admin_01',
          email: email || 'admin@proteinshop.com',
          fullName: 'Store Admin',
          role: 'admin',
        }
      : {
          id: 'user_customer_01',
          email: email || 'customer@example.com',
          fullName: email.includes('@') ? email.split('@')[0] : 'Jane Doe',
          role: 'customer',
        };

    saveUserSession(authUser);
    return true;
  };

  const register = async (email: string, password?: string, fullName?: string): Promise<boolean> => {
    if (password) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName || email.split('@')[0],
            role: email.includes('admin') ? 'admin' : 'customer',
          },
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.user) {
        const isTargetAdmin = email.toLowerCase().includes('admin');
        const authUser: AuthUser = {
          id: data.user.id,
          email: data.user.email || email,
          fullName: fullName || email.split('@')[0],
          role: isTargetAdmin ? 'admin' : 'customer',
        };
        saveUserSession(authUser);
        return true;
      }
    }

    const isTargetAdmin = email.toLowerCase().includes('admin');
    const authUser: AuthUser = {
      id: `user_${Date.now().toString(36)}`,
      email,
      fullName: fullName || email.split('@')[0],
      role: isTargetAdmin ? 'admin' : 'customer',
    };
    saveUserSession(authUser);
    return true;
  };

  const logout = async () => {
    await supabase.auth.signOut().catch(() => null);
    saveUserSession(null);
  };

  const switchRole = (newRole: UserRole) => {
    if (newRole === 'admin') {
      saveUserSession(DEFAULT_ADMIN_USER);
    } else {
      saveUserSession(DEFAULT_CUSTOMER_USER);
    }
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
        switchRole,
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
