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
      (event, session) => {
        setSession(session);
        setAuthUser(session?.user ?? null);
        
        if (session?.user) {
          // Defer profile fetching to avoid deadlock
          setTimeout(() => {
            const fetchProfile = async () => {
              const { data: profile, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('user_id', session.user.id)
                .maybeSingle();

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
              } else if (!error || error.code === 'PGRST116') {
                // Profile doesn't exist, create it from user metadata
                const userData = session.user.user_metadata;
                const isAdmin = session.user.email === 'games@learn2earn.com';
                const { error: insertError } = await supabase
                  .from('profiles')
                  .insert({
                    user_id: session.user.id,
                    name: userData?.name || 'User',
                    email: session.user.email || '',
                    country: userData?.country || '',
                    balance: isAdmin ? 1000 : 2,
                    total_earnings: 0,
                    quizzes_played: 0,
                    quizzes_won: 0,
                    rank: isAdmin ? 1 : 999,
                    is_admin: isAdmin
                  });
                
                if (!insertError) {
                  setUser({
                    id: session.user.id,
                    name: userData?.name || 'User',
                    email: session.user.email || '',
                    country: userData?.country || '',
                    avatar: null,
                    isAdmin: isAdmin,
                    balance: isAdmin ? 1000 : 2,
                    totalEarnings: 0,
                    quizzesPlayed: 0,
                    quizzesWon: 0,
                    rank: isAdmin ? 1 : 999
                  });
                }
              }
            };
            fetchProfile();
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
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    // Check if email is confirmed
    if (!error && data.user && !data.user.email_confirmed_at) {
      setIsLoading(false);
      return { 
        error: { 
          message: 'Please check your email and click the verification link before signing in.' 
        } 
      };
    }
    
    setIsLoading(false);
    return { error };
  };

  const register = async (name: string, email: string, password: string, country: string) => {
    setIsLoading(true);
    
    const redirectUrl = `${window.location.origin}/email-verify`;
    
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

    // Only create profile if signup was successful and user was created
    if (!error && data.user && !data.session) {
      // User was created but needs email verification
      // Profile will be created after email verification via trigger
      setIsLoading(false);
      return { error: null, needsVerification: true };
    }

    if (!error && data.user && data.session) {
      // User was created and logged in (email confirmation disabled)
      const isAdmin = email === 'games@learn2earn.com';
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: data.user.id,
          name,
          email,
          country,
          balance: isAdmin ? 1000 : 2, // Higher balance for admin
          total_earnings: 0,
          quizzes_played: 0,
          quizzes_won: 0,
          rank: isAdmin ? 1 : 999,
          is_admin: isAdmin
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