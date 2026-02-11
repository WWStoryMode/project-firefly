'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Phone, Lock, User, Loader2, ShoppingBag, Store, Truck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/use-auth';
import { DEMO_MODE } from '@/lib/config/demo';
import type { UserRole } from '@/types';

type AuthMethod = 'email' | 'phone';

const roleOptions = [
  {
    value: 'customer' as UserRole,
    label: 'Customer',
    description: 'Order food from local vendors',
    icon: ShoppingBag,
    color: 'border-green-500 bg-green-50 dark:bg-green-950',
    selectedColor: 'border-green-500 ring-2 ring-green-500',
  },
  {
    value: 'vendor' as UserRole,
    label: 'Vendor',
    description: 'Sell food to the community',
    icon: Store,
    color: 'border-amber-500 bg-amber-50 dark:bg-amber-950',
    selectedColor: 'border-amber-500 ring-2 ring-amber-500',
  },
  {
    value: 'delivery' as UserRole,
    label: 'Delivery',
    description: 'Deliver orders in your area',
    icon: Truck,
    color: 'border-blue-500 bg-blue-50 dark:bg-blue-950',
    selectedColor: 'border-blue-500 ring-2 ring-blue-500',
  },
];

export default function RegisterPage() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [method, setMethod] = useState<AuthMethod>('email');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('customer');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Demo mode doesn't need registration
  if (DEMO_MODE) {
    router.push('/');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password) return;

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError(null);

    const { error: signUpError } = await signUp(email.trim(), password, name.trim(), role);

    if (signUpError) {
      setError(signUpError);
      setLoading(false);
    } else {
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Create Account</CardTitle>
          <CardDescription>Join the Firefly community</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Method Tabs */}
          <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
            <button
              type="button"
              onClick={() => { setMethod('email'); setError(null); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-l-lg transition-colors ${
                method === 'email'
                  ? 'bg-green-600 text-white'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Mail className="w-4 h-4" />
              Email
            </button>
            <button
              type="button"
              onClick={() => { setMethod('phone'); setError(null); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-r-lg transition-colors ${
                method === 'phone'
                  ? 'bg-green-600 text-white'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Phone className="w-4 h-4" />
              Phone
            </button>
          </div>

          {method === 'phone' ? (
            <div className="text-center py-8">
              <Phone className="w-10 h-10 mx-auto mb-3 text-gray-400" />
              <p className="text-gray-600 dark:text-gray-400 font-medium">
                Phone registration coming soon
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                Use email to create your account for now
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Full Name
                </label>
                <Input
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-12"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email
                </label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12"
                  minLength={6}
                  required
                />
              </div>

              {/* Role Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">I want to...</label>
                <div className="grid grid-cols-3 gap-2">
                  {roleOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setRole(opt.value)}
                      className={`p-3 rounded-lg border-2 text-center transition-all ${
                        role === opt.value ? opt.selectedColor : opt.color
                      }`}
                    >
                      <opt.icon className="w-5 h-5 mx-auto mb-1" />
                      <span className="text-xs font-medium block">{opt.label}</span>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  {roleOptions.find((o) => o.value === role)?.description}
                </p>
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
                    Creating account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>
            </form>
          )}

          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
            Already have an account?{' '}
            <Link
              href="/login"
              className="text-green-600 hover:text-green-700 font-medium"
            >
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
