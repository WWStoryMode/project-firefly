'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Phone, Lock, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/use-auth';
import { DEMO_MODE } from '@/lib/config/demo';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Demo mode doesn't need login
  if (DEMO_MODE) {
    router.push('/');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim() || !password) return;

    setLoading(true);
    setError(null);

    const { error: signInError } = await signIn(phone.trim(), password);

    if (signInError) {
      setError(signInError);
      setLoading(false);
    } else {
      const redirect = searchParams.get('redirect') || '/';
      router.push(redirect);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Sign In</CardTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Welcome back to Firefly
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Phone Number
              </label>
              <Input
                type="tel"
                placeholder="+1 555 000 0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-12"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Password
              </label>
              <Input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12"
                required
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 rounded-lg text-sm text-center">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 h-12 text-base"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
            Don&apos;t have an account?{' '}
            <Link
              href="/register"
              className="text-green-600 hover:text-green-700 font-medium"
            >
              Create one
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
