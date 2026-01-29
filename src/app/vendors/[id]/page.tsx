import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, MapPin } from 'lucide-react';
import { MenuItemCard } from './menu-item-card';
import { CartFloatingButton } from './cart-floating-button';
import type { Vendor, MenuItem } from '@/lib/supabase/types';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function VendorMenuPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: vendor } = await supabase
    .from('vendors')
    .select('*')
    .eq('id', id)
    .single() as { data: Vendor | null };

  if (!vendor) {
    notFound();
  }

  const { data: menuItems } = await supabase
    .from('menu_items')
    .select('*')
    .eq('vendor_id', id)
    .eq('is_available', true)
    .order('category', { ascending: true }) as { data: MenuItem[] | null };

  // Group by category
  const itemsByCategory = (menuItems || []).reduce((acc, item) => {
    const category = item.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <Link
            href="/vendors"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-2"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Vendors
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {vendor.name}
          </h1>
          {vendor.address && (
            <p className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mt-1">
              <MapPin className="w-3 h-3" />
              {vendor.address}
            </p>
          )}
          {vendor.description && (
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
              {vendor.description}
            </p>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {Object.keys(itemsByCategory).length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">
                No menu items available yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {Object.entries(itemsByCategory).map(([category, items]) => (
              <div key={category}>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  {category}
                </h2>
                <div className="space-y-4">
                  {items?.map((item) => (
                    <MenuItemCard key={item.id} item={item} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <CartFloatingButton vendorId={id} />
    </div>
  );
}
