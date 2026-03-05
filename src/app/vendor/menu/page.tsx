'use client';

import { useState, useEffect } from 'react';
import { UtensilsCrossed, Power, Pencil, Plus, ArrowLeft } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { MenuItemDialog } from '@/components/menu-item-dialog';
import type { MenuItem } from '@/lib/supabase/types';

export default function VendorMenuPage() {
  const { vendorId } = useAuth();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<MenuItem | undefined>(undefined);

  useEffect(() => {
    if (!vendorId) return;
    fetchItems();
  }, [vendorId]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/menu-items?vendor_id=${vendorId}`);
      const data = await res.json();
      if (res.ok) setItems(data.items ?? []);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (item: MenuItem) => {
    setToggling(item.id);
    try {
      const res = await fetch(`/api/menu-items/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_available: !item.is_available }),
      });
      if (res.ok) {
        const data = await res.json();
        setItems((prev) => prev.map((i) => (i.id === item.id ? data.item : i)));
      }
    } finally {
      setToggling(null);
    }
  };

  const handleDialogSuccess = (savedItem: MenuItem) => {
    setItems((prev) => {
      const exists = prev.find((i) => i.id === savedItem.id);
      return exists
        ? prev.map((i) => (i.id === savedItem.id ? savedItem : i))
        : [...prev, savedItem];
    });
  };

  const openAdd = () => {
    setEditItem(undefined);
    setDialogOpen(true);
  };

  const openEdit = (item: MenuItem) => {
    setEditItem(item);
    setDialogOpen(true);
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

  // Group items by category
  const grouped = items.reduce<Record<string, MenuItem[]>>((acc, item) => {
    const key = item.category?.trim() || 'Uncategorized';
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  const sortedCategories = Object.keys(grouped).sort((a, b) => {
    if (a === 'Uncategorized') return 1;
    if (b === 'Uncategorized') return -1;
    return a.localeCompare(b);
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-amber-600 text-white">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/vendor">
                <Button variant="ghost" size="sm" className="text-white hover:bg-amber-700 -ml-2">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
              <UtensilsCrossed className="w-6 h-6" />
              <div>
                <h1 className="text-xl font-bold">Menu Management</h1>
                <p className="text-sm text-amber-100">Manage your menu items</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="bg-white text-amber-600 hover:bg-amber-50 border-white"
              onClick={openAdd}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
          </div>
        ) : items.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <UtensilsCrossed className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                No menu items yet. Add your first item to get started.
              </p>
              <Button
                className="bg-amber-600 hover:bg-amber-700"
                onClick={openAdd}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add First Item
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {sortedCategories.map((category) => (
              <div key={category}>
                <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                  {category}
                </h2>
                <div className="space-y-2">
                  {grouped[category].map((item) => (
                    <Card key={item.id}>
                      <CardContent className="py-3 px-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-gray-900 dark:text-white">
                                {item.name}
                              </span>
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                  item.is_available
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                                    : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                                }`}
                              >
                                {item.is_available ? 'Available' : 'Unavailable'}
                              </span>
                            </div>
                            {item.description && (
                              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                                {item.description}
                              </p>
                            )}
                            <p className="text-sm font-semibold text-amber-600 mt-1">
                              ${Number(item.price).toFixed(2)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEdit(item)}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggle(item)}
                              disabled={toggling === item.id}
                              title={item.is_available ? 'Mark unavailable' : 'Mark available'}
                            >
                              {toggling === item.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Power className="w-3.5 h-3.5" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <MenuItemDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        vendorId={vendorId}
        item={editItem}
        onSuccess={handleDialogSuccess}
      />
    </div>
  );
}
