import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, ChevronRight } from 'lucide-react';
import type { Vendor } from '@/lib/supabase/types';

export default async function VendorsPage() {
  const supabase = await createClient();

  const { data: vendors } = await supabase
    .from('vendors')
    .select('*')
    .eq('is_active', true) as { data: Vendor[] | null };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Local Vendors
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Order from your community
          </p>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {!vendors || vendors.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">
                No vendors available yet. Check back soon!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {vendors.map((vendor) => (
              <Link key={vendor.id} href={`/vendors/${vendor.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{vendor.name}</CardTitle>
                        {vendor.address && (
                          <CardDescription className="flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3" />
                            {vendor.address}
                          </CardDescription>
                        )}
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </CardHeader>
                  {vendor.description && (
                    <CardContent className="pt-0">
                      <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                        {vendor.description}
                      </p>
                    </CardContent>
                  )}
                </Card>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-8 text-center">
          <Link href="/cart">
            <Button variant="outline">View Cart</Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
