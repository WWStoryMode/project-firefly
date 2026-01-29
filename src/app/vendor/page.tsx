'use client';

import { useState } from 'react';
import { Store, Clock, ChefHat, Package, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { OrderStatusBadge } from '@/components/order-status';
import { useVendorOrders, updateOrderStatus } from '@/hooks/use-orders';
import type { OrderWithDetails } from '@/lib/supabase/types';

// Demo vendor ID - in real app this would come from auth
const DEMO_VENDOR_ID = '10000000-0000-0000-0000-000000000001';

export default function VendorDashboard() {
  const { orders, loading, error } = useVendorOrders(DEMO_VENDOR_ID);
  const [updating, setUpdating] = useState<string | null>(null);

  const handleStatusUpdate = async (orderId: string, newStatus: 'confirmed' | 'preparing' | 'ready') => {
    setUpdating(orderId);
    try {
      await updateOrderStatus(orderId, newStatus);
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-amber-600 text-white">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Store className="w-6 h-6" />
            <div>
              <h1 className="text-xl font-bold">Vendor Dashboard</h1>
              <p className="text-sm text-amber-100">Maria&apos;s Kitchen</p>
            </div>
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

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Order Queue
          </h2>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {orders.length} {orders.length === 1 ? 'order' : 'orders'}
          </span>
        </div>

        {orders.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Clock className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                No orders yet. Waiting for customers...
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                updating={updating === order.id}
                onStatusUpdate={handleStatusUpdate}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

interface OrderCardProps {
  order: OrderWithDetails;
  updating: boolean;
  onStatusUpdate: (orderId: string, status: 'confirmed' | 'preparing' | 'ready') => void;
}

function OrderCard({ order, updating, onStatusUpdate }: OrderCardProps) {
  const getNextAction = () => {
    switch (order.status) {
      case 'pending':
        return { label: 'Accept Order', status: 'confirmed' as const, icon: ChefHat };
      case 'confirmed':
        return { label: 'Start Preparing', status: 'preparing' as const, icon: ChefHat };
      case 'preparing':
        return { label: 'Mark Ready', status: 'ready' as const, icon: Package };
      default:
        return null;
    }
  };

  const nextAction = getNextAction();

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">
              Order #{order.id.slice(0, 8)}
            </CardTitle>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {new Date(order.created_at).toLocaleTimeString()}
            </p>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 mb-4">
          {order.items?.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span>
                {item.quantity}x {item.name}
              </span>
              <span className="text-gray-500 dark:text-gray-400">
                ${(item.unit_price * item.quantity).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
        <Separator className="my-3" />
        <div className="flex justify-between font-medium mb-4">
          <span>Total</span>
          <span className="text-green-600 dark:text-green-400">
            ${Number(order.total_amount).toFixed(2)}
          </span>
        </div>

        <div className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          <p className="font-medium">Deliver to:</p>
          <p>{order.delivery_address}</p>
          {order.delivery_notes && (
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Note: {order.delivery_notes}
            </p>
          )}
        </div>

        {nextAction && (
          <Button
            className="w-full bg-amber-600 hover:bg-amber-700"
            onClick={() => onStatusUpdate(order.id, nextAction.status)}
            disabled={updating}
          >
            {updating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <nextAction.icon className="w-4 h-4 mr-2" />
            )}
            {nextAction.label}
          </Button>
        )}

        {order.status === 'ready' && (
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-2">
            Waiting for delivery pickup...
          </p>
        )}
      </CardContent>
    </Card>
  );
}
