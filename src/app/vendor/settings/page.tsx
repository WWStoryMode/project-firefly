'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/use-auth';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function VendorSettingsPage() {
  const { vendorId } = useAuth();
  const router = useRouter();

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [clearingMenu, setClearingMenu] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);

  useEffect(() => {
    if (!vendorId) return;

    const supabase = createClient();
    supabase
      .from('vendors')
      .select('name, address')
      .eq('id', vendorId)
      .single()
      .then(({ data }) => {
        if (data) {
          setName(data.name ?? '');
          setAddress(data.address ?? '');
        }
        setLoadingProfile(false);
      });
  }, [vendorId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorId) return;
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    const res = await fetch(`/api/vendors/${vendorId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), address: address.trim() }),
    });

    if (res.ok) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } else {
      const data = await res.json();
      setSaveError(data.error ?? 'Failed to save');
    }
    setSaving(false);
  };

  const handleClearMenu = async () => {
    if (!vendorId) return;
    setClearingMenu(true);
    const res = await fetch(`/api/menu-items?vendor_id=${vendorId}`, { method: 'DELETE' });
    setClearingMenu(false);
    setConfirmClear(false);
    if (!res.ok) alert('Failed to clear menu. Please try again.');
  };

  const handleDeactivate = async () => {
    if (!vendorId) return;
    setDeactivating(true);
    const res = await fetch(`/api/vendors/${vendorId}`, {
      method: 'DELETE',
    });
    setDeactivating(false);
    setConfirmDeactivate(false);
    if (res.ok) {
      router.push('/');
    } else {
      alert('Failed to deactivate shop. Please try again.');
    }
  };

  if (!vendorId) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Setting up vendor account...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-amber-600 text-white">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Link href="/vendor">
              <Button variant="ghost" size="sm" className="text-white hover:bg-amber-700 -ml-2">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <Settings className="w-6 h-6" />
            <div>
              <h1 className="text-xl font-bold">Shop Settings</h1>
              <p className="text-sm text-amber-100">Manage your shop details</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Shop details form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Shop Details</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingProfile ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
              </div>
            ) : (
              <form onSubmit={handleSave} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Shop Name</label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Maria's Kitchen"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Location / Address</label>
                  <Input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. 123 Market St, Building B"
                  />
                </div>

                {saveError && (
                  <div className="p-3 bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 rounded-lg text-sm text-center">
                    {saveError}
                  </div>
                )}
                {saveSuccess && (
                  <div className="p-3 bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400 rounded-lg text-sm text-center">
                    Saved successfully
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-amber-600 hover:bg-amber-700"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Danger zone */}
        <Card className="border-red-200 dark:border-red-800">
          <CardHeader>
            <CardTitle className="text-base text-red-600 dark:text-red-400">Danger Zone</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Clear menu */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">Clear Menu</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Permanently delete all menu items
                </p>
              </div>
              {confirmClear ? (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setConfirmClear(false)}
                    disabled={clearingMenu}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="bg-red-600 hover:bg-red-700 text-white"
                    onClick={handleClearMenu}
                    disabled={clearingMenu}
                  >
                    {clearingMenu ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm'}
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400"
                  onClick={() => setConfirmClear(true)}
                >
                  Clear Menu
                </Button>
              )}
            </div>

            <div className="border-t dark:border-gray-700" />

            {/* Deactivate shop */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">Deactivate Shop</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Hides your shop from customers
                </p>
              </div>
              {confirmDeactivate ? (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setConfirmDeactivate(false)}
                    disabled={deactivating}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="bg-red-600 hover:bg-red-700 text-white"
                    onClick={handleDeactivate}
                    disabled={deactivating}
                  >
                    {deactivating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm'}
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400"
                  onClick={() => setConfirmDeactivate(true)}
                >
                  Deactivate
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
