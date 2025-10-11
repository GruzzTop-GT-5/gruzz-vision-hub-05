import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: string | null;
  userType: string | null;
  userSubtype: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

export const useAuth = (): AuthContextType => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userType, setUserType] = useState<string | null>(null);
  const [userSubtype, setUserSubtype] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserRole(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Defer role fetching to avoid deadlock
          setTimeout(() => {
            fetchUserRole(session.user.id);
          }, 0);
        } else {
          setUserRole(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (userId: string) => {
    try {
      // Fetch role from secure user_roles table
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      // Fetch user type and subtype from profiles
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('user_type, user_subtype')
        .eq('id', userId)
        .maybeSingle();

      if (roleError && roleError.code !== 'PGRST116') {
        console.error('Error fetching user role:', roleError);
      }

      if (profileError) {
        console.error('Error fetching profile:', profileError);
      }

      const role = roleData?.role || 'user';
      const type = profileData?.user_type || null;
      const subtype = profileData?.user_subtype || null;
      
      setUserRole(role);
      setUserType(type);
      setUserSubtype(subtype);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching user data:', error);
      setUserRole('user');
      setUserType(null);
      setUserSubtype(null);
      setLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setUserRole(null);
    setUserType(null);
    setUserSubtype(null);
    // Перенаправление будет обработано в компонентах
  };

  return {
    user,
    session,
    userRole,
    userType,
    userSubtype,
    loading,
    signOut
  };
};