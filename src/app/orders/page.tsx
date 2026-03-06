'use client';

import Link from 'next/link';
import { ArrowLeft, ShoppingBag, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { OrderStatusBadge } from '@/components/order-status';
import { useCustomerOrders } from '@/hooks/use-orders';
import { useAuth } from '@/hooks/use-auth';

const ACTIVE_STATUSES = ['pending', 'confirmed', 'preparing', 'ready', 'picked_up'];
const PAST_STATUSES = ['delivered', 'cancelled'];

export default function CustomerOrdersPage() {
  const { userId } = useAuth();
  const { orders, loading, error } = useCustomerOrders(userId ?? '');

  if (!userId || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Loading orders...</p>
        </div>
      </div>
    );
  }

  const activeOrders = orders.filter((o) => ACTIVE_STATUSES.includes(o.status));
  const pastOrders = orders.filter((o) => PAST_STATUSES.includes(o.status));

  const totalSpent = pastOrders
    .filter((o) => o.status === 'delivered')
    .reduce((sum, o) => sum + Number(o.total_amount), 0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-green-600 text-white">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Link href="/vendors">
              <Button variant="ghost" size="sm" className="text-white hover:bg-green-700 -ml-2">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <ShoppingBag className="w-6 h-6" />
            <h1 className="text-xl font-bold">My Orders</h1>
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
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{orders.length}</p>
              <p className="text-xs text-muted-foreground">Total Orders</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center pb-4">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">${totalSpent.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">Total Spent</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center pb-4">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{activeOrders.length}</p>
              <p className="text-xs text-muted-foreground">Active Orders</p>
            </CardContent>
          </Card>
        </div>

        {orders.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Clock className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No orders yet. Start ordering!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {activeOrders.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                  Active
                </h2>
                <div className="space-y-3">
                  {activeOrders.map((order) => (
                    <Link key={order.id} href={`/orders/${order.id}`}>
                      <Card className="hover:shadow-md transition-shadow cursor-pointer">
                        <CardContent className="py-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {order.vendor?.name ?? 'Vendor'}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(order.created_at).toLocaleDateString()} · {order.items?.length ?? 0} item{order.items?.length !== 1 ? 's' : ''}
                              </p>
                            </div>
                            <OrderStatusBadge status={order.status} />
                          </div>
                          <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                            ${Number(order.total_amount).toFixed(2)}
                          </p>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {pastOrders.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                  Past
                </h2>
                <div className="space-y-3">
                  {pastOrders.map((order) => (
                    <Card key={order.id}>
                      <CardContent className="py-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {order.vendor?.name ?? 'Vendor'}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(order.created_at).toLocaleDateString()} · {order.items?.length ?? 0} item{order.items?.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                          <OrderStatusBadge status={order.status} />
                        </div>
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                          ${Number(order.total_amount).toFixed(2)}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
