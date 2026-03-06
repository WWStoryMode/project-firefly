'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  ReactNode,
} from 'react';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { useRole } from '@/hooks/use-role';
import type { UserRole } from '@/types';

interface AuthContextType {
  user: {
    id: string;
    email: string;
    name: string;
    roles: UserRole[];
    default_role?: UserRole;
  } | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
    name: string,
    role: UserRole
  ) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  addRole: (role: UserRole) => Promise<void>;
  userId: string | null;
  vendorId: string | null;
  deliveryPersonId: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { currentRole } = useRole();

  return (
    <ProductionAuthProvider currentRole={currentRole}>
      {children}
    </ProductionAuthProvider>
  );
}

function ProductionAuthProvider({
  children,
  currentRole,
}: {
  children: ReactNode;
  currentRole: UserRole;
}) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AuthContextType['user']>(null);
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [deliveryPersonId, setDeliveryPersonId] = useState<string | null>(null);
  const provisioningRef = useRef<string | null>(null);
  const supabase = useMemo(() => {
    if (typeof window === 'undefined') return null;
    return createClient();
  }, []);

  const [loading, setLoading] = useState(!!supabase);

  const fetchUserProfile = useCallback(
    async (authUser: SupabaseUser) => {
      if (!supabase) return;
      // Fetch public.users record
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (profile) {
        setUser({
          id: profile.id,
          email: profile.email || authUser.email || '',
          name: profile.name,
          roles: profile.roles || ['customer'],
          default_role: profile.default_role,
        });

        // Eagerly fetch vendor record regardless of user.roles
        const { data: vendorRows } = await supabase
          .from('vendors')
          .select('id')
          .eq('user_id', profile.id)
          .limit(1);
        setVendorId(vendorRows?.[0]?.id || null);

        // Eagerly fetch delivery person record regardless of user.roles
        const { data: dpRows } = await supabase
          .from('delivery_persons')
          .select('id')
          .eq('user_id', profile.id)
          .limit(1);
        setDeliveryPersonId(dpRows?.[0]?.id || null);
      }
    },
    [supabase]
  );

  useEffect(() => {
    if (!supabase) return;

    // Get initial session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s?.user) {
        fetchUserProfile(s.user).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s?.user) {
        fetchUserProfile(s.user);
      } else {
        setUser(null);
        setVendorId(null);
        setDeliveryPersonId(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, fetchUserProfile]);

  // Lazy provisioning: auto-create vendor/delivery records when role switches
  useEffect(() => {
    if (!supabase || !user) return;

    if (currentRole === 'vendor' && !vendorId) {
      // Prevent duplicate provisioning
      if (provisioningRef.current === 'vendor') return;
      provisioningRef.current = 'vendor';

      supabase
        .from('vendors')
        .insert({
          user_id: user.id,
          name: `${user.name}'s Kitchen`,
          is_active: true,
        })
        .select('id')
        .single()
        .then(async ({ data, error }) => {
          if (data) {
            setVendorId(data.id);
          } else if (error) {
            // Insert may have failed because the record already exists — try fetching it
            const { data: existingRows } = await supabase
              .from('vendors')
              .select('id')
              .eq('user_id', user.id)
              .limit(1);
            const existing = existingRows?.[0];
            if (existing) {
              setVendorId(existing.id);
            } else {
              console.error('Failed to provision vendor:', error);
            }
          }
          provisioningRef.current = null;
        });
    }

    if (currentRole === 'delivery' && !deliveryPersonId) {
      if (provisioningRef.current === 'delivery') return;
      provisioningRef.current = 'delivery';

      supabase
        .from('delivery_persons')
        .insert({
          user_id: user.id,
          is_active: true,
          is_available: true,
          vehicle_type: 'bike',
        })
        .select('id')
        .single()
        .then(async ({ data, error }) => {
          if (data) {
            setDeliveryPersonId(data.id);
          } else if (error) {
            // Insert may have failed because the record already exists — try fetching it
            const { data: existingRows } = await supabase
              .from('delivery_persons')
              .select('id')
              .eq('user_id', user.id)
              .limit(1);
            const existing = existingRows?.[0];
            if (existing) {
              setDeliveryPersonId(existing.id);
            } else {
              console.error('Failed to provision delivery person:', error);
            }
          }
          provisioningRef.current = null;
        });
    }
  }, [supabase, user, currentRole, vendorId, deliveryPersonId]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      if (!supabase) return { error: 'Not initialized' };
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) return { error: error.message };
      return { error: null };
    },
    [supabase]
  );

  const signUp = useCallback(
    async (email: string, password: string, name: string, _role: UserRole) => {
      if (!supabase) return { error: 'Not initialized' };
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
      });
      if (error) return { error: error.message };
      if (!data.user) return { error: 'Sign up failed' };

      // Profile is created automatically via the handle_new_user DB trigger.
      return { error: null };
    },
    [supabase]
  );

  const addRole = useCallback(
    async (role: UserRole) => {
      if (!supabase || !user) return;
      if (user.roles.includes(role)) return;
      const newRoles = [...user.roles, role];
      const { error } = await supabase
        .from('users')
        .update({ roles: newRoles })
        .eq('id', user.id);
      if (!error) {
        setUser((prev) => (prev ? { ...prev, roles: newRoles } : prev));
      }
    },
    [supabase, user]
  );

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
    setVendorId(null);
    setDeliveryPersonId(null);
  }, [supabase]);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      session,
      loading,
      signIn,
      signUp,
      signOut,
      addRole,
      userId: user?.id || null,
      vendorId,
      deliveryPersonId,
    }),
    [user, session, loading, signIn, signUp, signOut, addRole, vendorId, deliveryPersonId]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
