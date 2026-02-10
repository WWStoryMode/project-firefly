import { createClient } from '@/lib/supabase/server';
import { DEMO_MODE } from '@/lib/config/demo';
import { NextResponse } from 'next/server';
import type { User } from '@supabase/supabase-js';

interface AuthResult {
  user: User | null;
  error: string | null;
  isDemoMode: boolean;
}

export async function getAuthenticatedUser(): Promise<AuthResult> {
  if (DEMO_MODE) {
    return { user: null, error: null, isDemoMode: true };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { user: null, error: 'Unauthorized', isDemoMode: false };
  }

  return { user, error: null, isDemoMode: false };
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
