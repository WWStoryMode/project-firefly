'use client';

import { use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Store, MapPin, Clock, Receipt } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { OrderStatusDisplay } from '@/components/order-status';
import { useOrderRealtime } from '@/hooks/use-orders';

interface Props {
  params: Promise<{ id: string }>;
}

export default function OrderTrackingPage({ params }: Props) {
  const { id } = use(params);
  const { order, loading, error } = useOrderRealtime(id);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Loading order...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-2xl mx-auto px-4 py-4">
            <Link
              href="/vendors"
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Vendors
            </Link>
          </div>
        </header>
        <main className="max-w-2xl mx-auto px-4 py-6">
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-red-500">
                {error || 'Order not found'}
              </p>
              <Link href="/vendors" className="mt-4 inline-block">
                <Button>Browse Vendors</Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <Link
            href="/vendors"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-2"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Vendors
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Order Tracking
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Order #{order.id.slice(0, 8)}
          </p>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Order Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Order Status</CardTitle>
          </CardHeader>
          <CardContent>
            <OrderStatusDisplay status={order.status} />
          </CardContent>
        </Card>

        {/* Vendor Info */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Store className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {order.vendor?.name || 'Vendor'}
                </p>
                {order.vendor?.address && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {order.vendor.address}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Delivery Address */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Delivering to
                </p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {order.delivery_address}
                </p>
                {order.delivery_notes && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Note: {order.delivery_notes}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Order Items */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              Order Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {order.items?.map((item) => (
              <div
                key={item.id}
                className="flex justify-between text-sm"
              >
                <span className="text-gray-600 dark:text-gray-300">
                  {item.quantity}x {item.name}
                </span>
                <span className="font-medium">
                  ${(item.unit_price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
            <Separator />
            <div className="flex justify-between font-semibold text-lg">
              <span>Total</span>
              <span className="text-green-600 dark:text-green-400">
                ${Number(order.total_amount).toFixed(2)}
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
              Cash on Delivery
            </p>
          </CardContent>
        </Card>

        {/* Order Time */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
              <Clock className="w-4 h-4" />
              <span>
                Ordered at {new Date(order.created_at).toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
