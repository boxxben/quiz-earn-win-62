import React, { createContext, useContext, useState, useEffect } from 'react';
import { User as AuthUser, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  authUser: AuthUser | null;
  login: (email: string, password: string) => Promise<{ error?: any }>;
  register: (name: string, email: string, password: string, country: string) => Promise<{ error?: any }>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  isLoading: boolean;
  hydrated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Initialize auth state
  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setAuthUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch user profile
          setTimeout(async () => {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('user_id', session.user.id)
              .single();

            if (profile) {
              setUser({
                id: profile.user_id,
                name: profile.name,
                email: profile.email,
                country: profile.country,
                avatar: profile.avatar,
                isAdmin: profile.is_admin,
                balance: profile.balance,
                totalEarnings: profile.total_earnings,
                quizzesPlayed: profile.quizzes_played,
                quizzesWon: profile.quizzes_won,
                rank: profile.rank
              });
            }
          }, 0);
        } else {
          setUser(null);
        }
        
        setHydrated(true);
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthUser(session?.user ?? null);
      if (!session) {
        setHydrated(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    setIsLoading(false);
    return { error };
  };

  const register = async (name: string, email: string, password: string, country: string) => {
    setIsLoading(true);
    
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          name,
          country
        }
      }
    });

    if (!error && data.user) {
      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: data.user.id,
          name,
          email,
          country,
          balance: 1000, // Starting balance
          total_earnings: 0,
          quizzes_played: 0,
          quizzes_won: 0,
          rank: 999
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
      }
    }
    
    setIsLoading(false);
    return { error };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setAuthUser(null);
  };

  const updateUser = async (updates: Partial<User>) => {
    if (user && authUser) {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: updates.name,
          country: updates.country,
          avatar: updates.avatar
        })
        .eq('user_id', authUser.id);

      if (!error) {
        setUser({ ...user, ...updates });
      }
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      authUser,
      login,
      register,
      logout,
      updateUser,
      isLoading,
      hydrated
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}