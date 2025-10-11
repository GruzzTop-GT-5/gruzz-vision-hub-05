import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: string | null;
  userType: string | null;
  userSubtype: string | null;
  needsRoleSelection: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
}

export const useAuth = (): AuthContextType => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userType, setUserType] = useState<string | null>(null);
  const [userSubtype, setUserSubtype] = useState<string | null>(null);
  const [needsRoleSelection, setNeedsRoleSelection] = useState(false);
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
      const { data, error } = await supabase
        .from('profiles')
        .select('user_type, user_subtype')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user role:', error);
        setUserRole('user');
        setUserType(null);
        setUserSubtype(null);
        setNeedsRoleSelection(false);
        setLoading(false);
        return;
      }

      // Try to get role from user_roles table (new secure system)
      try {
        const { data: roleData } = await (supabase as any)
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .order('assigned_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (roleData?.role) {
          setUserRole(roleData.role);
        } else {
          setUserRole('user');
        }
      } catch {
        // Fallback to user role if user_roles table doesn't exist yet
        setUserRole('user');
      }

      const type = data?.user_type || null;
      const subtype = data?.user_subtype || null;
      
      setUserType(type);
      setUserSubtype(subtype);
      
      // Если user_type не установлен, пользователю нужно выбрать роль
      setNeedsRoleSelection(!type || !subtype);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching user role:', error);
      setUserRole('user');
      setUserType(null);
      setUserSubtype(null);
      setNeedsRoleSelection(false);
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
    setNeedsRoleSelection(false);
    // Перенаправление будет обработано в компонентах
  };

  return {
    user,
    session,
    userRole,
    userType,
    userSubtype,
    needsRoleSelection,
    loading,
    signOut
  };
};