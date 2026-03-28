import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { UserProfile, DailyTargets } from '../types';
import { calculateDailyTargets } from '../lib/tdee';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isDemo: boolean;
  targets: DailyTargets;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => void;
}

// Demo user for when Supabase isn't configured
const DEMO_USER: UserProfile = {
  id: 'demo-user',
  email: 'demo@nouri.app',
  display_name: 'Jaineel',
  age: 21,
  sex: 'male',
  height_cm: 178,
  weight_kg: 75,
  activity_level: 'moderately_active',
  goal: 'lose_slow',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const isDemo = !isSupabaseConfigured;

  const targets: DailyTargets =
    user?.age && user?.sex && user?.height_cm && user?.weight_kg && user?.activity_level && user?.goal
      ? calculateDailyTargets({
          weight_kg: user.weight_kg,
          height_cm: user.height_cm,
          age: user.age,
          sex: user.sex,
          activity_level: user.activity_level,
          goal: user.goal,
        })
      : { calories: 2000, protein: 150, carbs: 200, fat: 67, fiber: 28 };

  useEffect(() => {
    if (isDemo) {
      setUser(DEMO_USER);
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          display_name:
            session.user.user_metadata?.full_name ||
            session.user.email?.split('@')[0] ||
            'User',
          avatar_url: session.user.user_metadata?.avatar_url,
          created_at: session.user.created_at,
          updated_at: new Date().toISOString(),
        });
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          display_name:
            session.user.user_metadata?.full_name ||
            session.user.email?.split('@')[0] ||
            'User',
          avatar_url: session.user.user_metadata?.avatar_url,
          created_at: session.user.created_at,
          updated_at: new Date().toISOString(),
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    if (isDemo) {
      setUser(DEMO_USER);
      return;
    }
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
  };

  const signInWithEmail = async (email: string, password: string) => {
    if (isDemo) {
      setUser(DEMO_USER);
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUpWithEmail = async (email: string, password: string, name: string) => {
    if (isDemo) {
      setUser({ ...DEMO_USER, email, display_name: name });
      return;
    }
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    if (isDemo) {
      setUser(null);
      return;
    }
    await supabase.auth.signOut();
    setUser(null);
  };

  const updateProfile = (updates: Partial<UserProfile>) => {
    setUser((prev) => (prev ? { ...prev, ...updates, updated_at: new Date().toISOString() } : null));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isDemo,
        targets,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
