'use client';

import Link from 'next/link';
import { ArrowLeft, Truck, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useDeliveryHistory } from '@/hooks/use-orders';
import { useAuth } from '@/hooks/use-auth';

export default function DeliveryHistoryPage() {
  const { deliveryPersonId } = useAuth();
  const { assignments, loading, error } = useDeliveryHistory(deliveryPersonId ?? '');

  if (!deliveryPersonId || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Loading history...</p>
        </div>
      </div>
    );
  }

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thisWeek = assignments.filter(
    (a) => a.delivered_at && new Date(a.delivered_at) >= sevenDaysAgo
  );
  const avgPerDay = thisWeek.length > 0 ? (thisWeek.length / 7).toFixed(1) : '0';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-blue-600 text-white">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Link href="/delivery">
              <Button variant="ghost" size="sm" className="text-white hover:bg-blue-700 -ml-2">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <Truck className="w-6 h-6" />
            <h1 className="text-xl font-bold">Delivery History</h1>
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
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{assignments.length}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center pb-4">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{thisWeek.length}</p>
              <p className="text-xs text-muted-foreground">This Week</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center pb-4">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{avgPerDay}</p>
              <p className="text-xs text-muted-foreground">Avg / Day</p>
            </CardContent>
          </Card>
        </div>

        {assignments.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Clock className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No completed deliveries yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {assignments.map((assignment) => {
              const order = assignment.order;
              return (
                <Card key={assignment.id}>
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between mb-2">
                      <p className="font-medium text-gray-900 dark:text-white text-sm">
                        #{order.id.slice(0, 8)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {assignment.delivered_at
                          ? new Date(assignment.delivered_at).toLocaleString()
                          : '—'}
                      </p>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                      <span className="font-medium">{order.vendor?.name ?? 'Vendor'}</span>
                      {' → '}
                      {order.delivery_address}
                    </p>
                    <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
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
