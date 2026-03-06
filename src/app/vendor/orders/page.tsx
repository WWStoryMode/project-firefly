'use client';

import Link from 'next/link';
import { ArrowLeft, ClipboardList, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { OrderStatusBadge } from '@/components/order-status';
import { useVendorOrderHistory } from '@/hooks/use-orders';
import { useAuth } from '@/hooks/use-auth';

export default function VendorOrderHistoryPage() {
  const { vendorId } = useAuth();
  const { orders, loading, error } = useVendorOrderHistory(vendorId ?? '');

  if (!vendorId || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Loading history...</p>
        </div>
      </div>
    );
  }

  const completed = orders.filter((o) => o.status === 'delivered');
  const cancelled = orders.filter((o) => o.status === 'cancelled');
  const totalRevenue = completed.reduce((sum, o) => sum + Number(o.total_amount), 0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-amber-600 text-white">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Link href="/vendor">
              <Button variant="ghost" size="sm" className="text-white hover:bg-amber-700 -ml-2">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <ClipboardList className="w-6 h-6" />
            <h1 className="text-xl font-bold">Order History</h1>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
            <CardContent className="py-4 text-center text-red-600 dark:text-red-400">
              {error}
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card>
            <CardContent className="pt-4 text-center pb-4">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{completed.length}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center pb-4">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">${totalRevenue.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">Total Revenue</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center pb-4">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{cancelled.length}</p>
              <p className="text-xs text-muted-foreground">Cancelled</p>
            </CardContent>
          </Card>
        </div>

        {orders.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Clock className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No completed orders yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => {
              const itemSummary = order.items
                ?.map((i) => `${i.quantity}× ${i.name}`)
                .join(', ');
              return (
                <Card key={order.id}>
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white text-sm">
                          #{order.id.slice(0, 8)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(order.created_at).toLocaleString()}
                        </p>
                      </div>
                      <OrderStatusBadge status={order.status} />
                    </div>
                    {itemSummary && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 line-clamp-1">
                        {itemSummary}
                      </p>
                    )}
                    <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                      ${Number(order.total_amount).toFixed(2)}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
