'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { DEMO_MODE, DEMO_IDS } from '@/lib/config/demo';
import { useRole } from '@/hooks/use-role';
import type { UserRole } from '@/types';

interface AuthContextType {
  user: {
    id: string;
    phone: string;
    name: string;
    roles: UserRole[];
    default_role?: UserRole;
  } | null;
  session: Session | null;
  loading: boolean;
  signIn: (phone: string, password: string) => Promise<{ error: string | null }>;
  signUp: (
    phone: string,
    password: string,
    name: string,
    role: UserRole
  ) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  userId: string | null;
  vendorId: string | null;
  deliveryPersonId: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo user mappings from seed.sql
const DEMO_USERS = {
  customer: {
    id: '00000000-0000-0000-0000-000000000001',
    phone: '555-0101',
    name: 'Demo Customer',
    roles: ['customer'] as UserRole[],
    default_role: 'customer' as UserRole,
  },
  vendor: {
    id: '00000000-0000-0000-0000-000000000002',
    phone: '555-0102',
    name: 'Maria Garcia',
    roles: ['vendor'] as UserRole[],
    default_role: 'vendor' as UserRole,
  },
  delivery: {
    id: '00000000-0000-0000-0000-000000000003',
    phone: '555-0103',
    name: 'Alex Johnson',
    roles: ['delivery'] as UserRole[],
    default_role: 'delivery' as UserRole,
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const { currentRole } = useRole();

  if (DEMO_MODE) {
    return (
      <DemoAuthProvider currentRole={currentRole}>
        {children}
      </DemoAuthProvider>
    );
  }

  return <ProductionAuthProvider>{children}</ProductionAuthProvider>;
}

function DemoAuthProvider({
  children,
  currentRole,
}: {
  children: ReactNode;
  currentRole: UserRole;
}) {
  const value = useMemo<AuthContextType>(() => {
    const demoUser = DEMO_USERS[currentRole];
    return {
      user: demoUser,
      session: null,
      loading: false,
      signIn: async () => ({ error: null }),
      signUp: async () => ({ error: null }),
      signOut: async () => {},
      userId: demoUser.id,
      vendorId: DEMO_IDS.VENDOR_ID,
      deliveryPersonId: DEMO_IDS.DELIVERY_PERSON_ID,
    };
  }, [currentRole]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function ProductionAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AuthContextType['user']>(null);
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [deliveryPersonId, setDeliveryPersonId] = useState<string | null>(null);
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
          phone: profile.phone || authUser.phone || '',
          name: profile.name,
          roles: profile.roles || ['customer'],
          default_role: profile.default_role,
        });

        // Fetch vendor record if user has vendor role
        if (profile.roles?.includes('vendor')) {
          const { data: vendor } = await supabase
            .from('vendors')
            .select('id')
            .eq('user_id', profile.id)
            .single();
          setVendorId(vendor?.id || null);
        }

        // Fetch delivery person record if user has delivery role
        if (profile.roles?.includes('delivery')) {
          const { data: dp } = await supabase
            .from('delivery_persons')
            .select('id')
            .eq('user_id', profile.id)
            .single();
          setDeliveryPersonId(dp?.id || null);
        }
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

  const signIn = useCallback(
    async (phone: string, password: string) => {
      if (!supabase) return { error: 'Not initialized' };
      const { error } = await supabase.auth.signInWithPassword({
        phone,
        password,
      });
      if (error) return { error: error.message };
      return { error: null };
    },
    [supabase]
  );

  const signUp = useCallback(
    async (phone: string, password: string, name: string, role: UserRole) => {
      if (!supabase) return { error: 'Not initialized' };
      const { data, error } = await supabase.auth.signUp({
        phone,
        password,
      });
      if (error) return { error: error.message };
      if (!data.user) return { error: 'Sign up failed' };

      // Create public.users record
      const { error: profileError } = await supabase.from('users').insert({
        id: data.user.id,
        email: '',
        name,
        phone,
        roles: [role],
        default_role: role,
      });

      if (profileError) {
        return { error: 'Account created but profile setup failed. Please contact support.' };
      }

      // Create role-specific records
      if (role === 'vendor') {
        await supabase.from('vendors').insert({
          user_id: data.user.id,
          name: `${name}'s Kitchen`,
          is_active: true,
        });
      } else if (role === 'delivery') {
        await supabase.from('delivery_persons').insert({
          user_id: data.user.id,
          is_active: true,
          is_available: true,
          vehicle_type: 'bike',
        });
      }

      return { error: null };
    },
    [supabase]
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
      userId: user?.id || null,
      vendorId,
      deliveryPersonId,
    }),
    [user, session, loading, signIn, signUp, signOut, vendorId, deliveryPersonId]
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
