'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Store, Clock, ChefHat, Package, Loader2, CheckCircle2, UtensilsCrossed, Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { OrderStatusBadge } from '@/components/order-status';
import { useVendorOrders, updateOrderStatus, vendorAcceptOrder } from '@/hooks/use-orders';
import type { OrderWithDetails, DeliveryAssignment } from '@/lib/supabase/types';
import { useAuth } from '@/hooks/use-auth';

// Extended order type with delivery assignment and vendor_accepted
interface VendorOrder extends OrderWithDetails {
  vendor_accepted: boolean;
  delivery_assignments?: DeliveryAssignment[];
}

export default function VendorDashboard() {
  const { vendorId } = useAuth();
  const { orders, loading, error } = useVendorOrders(vendorId ?? '');
  const [updating, setUpdating] = useState<string | null>(null);

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

  const handleAcceptOrder = async (orderId: string) => {
    setUpdating(orderId);
    try {
      await vendorAcceptOrder(orderId);
    } catch (err) {
      console.error('Failed to accept order:', err);
    } finally {
      setUpdating(null);
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: 'preparing' | 'ready') => {
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Store className="w-6 h-6" />
              <div>
                <h1 className="text-xl font-bold">Vendor Dashboard</h1>
                <p className="text-sm text-amber-100">Maria&apos;s Kitchen</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href="/vendor/menu">
                <Button variant="outline" size="sm" className="bg-white text-amber-600 hover:bg-amber-50 border-white">
                  <UtensilsCrossed className="w-4 h-4 mr-2" />
                  Menu
                </Button>
              </Link>
              <Link href="/vendor/settings">
                <Button variant="outline" size="sm" className="bg-white text-amber-600 hover:bg-amber-50 border-white">
                  <Settings className="w-4 h-4" />
                </Button>
              </Link>
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
                order={order as VendorOrder}
                updating={updating === order.id}
                onAccept={handleAcceptOrder}
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
  order: VendorOrder;
  updating: boolean;
  onAccept: (orderId: string) => void;
  onStatusUpdate: (orderId: string, status: 'preparing' | 'ready') => void;
}

function OrderCard({ order, updating, onAccept, onStatusUpdate }: OrderCardProps) {
  // Check if vendor has accepted but waiting for delivery
  const vendorAccepted = order.vendor_accepted;
  const deliveryAssignment = order.delivery_assignments?.[0];
  const deliveryAccepted = deliveryAssignment?.status === 'accepted';

  const getNextAction = () => {
    // Pending and vendor hasn't accepted yet -> show Accept button
    if (order.status === 'pending' && !vendorAccepted) {
      return { type: 'accept' as const, label: 'Accept Order', icon: CheckCircle2 };
    }
    // Pending but vendor accepted -> waiting for delivery (no action)
    if (order.status === 'pending' && vendorAccepted) {
      return null;
    }
    // Confirmed -> can start preparing
    if (order.status === 'confirmed') {
      return { type: 'status' as const, label: 'Start Preparing', status: 'preparing' as const, icon: ChefHat };
    }
    // Preparing -> can mark ready
    if (order.status === 'preparing') {
      return { type: 'status' as const, label: 'Mark Ready', status: 'ready' as const, icon: Package };
    }
    return null;
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

        {/* Acceptance status indicators */}
        {order.status === 'pending' && (
          <div className="flex gap-2 mb-4 text-xs">
            <span className={`px-2 py-1 rounded ${vendorAccepted ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'}`}>
              Vendor: {vendorAccepted ? '✓ Accepted' : 'Pending'}
            </span>
            <span className={`px-2 py-1 rounded ${deliveryAccepted ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'}`}>
              Delivery: {deliveryAccepted ? '✓ Accepted' : 'Pending'}
            </span>
          </div>
        )}

        {nextAction?.type === 'accept' && (
          <Button
            className="w-full bg-amber-600 hover:bg-amber-700"
            onClick={() => onAccept(order.id)}
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

        {nextAction?.type === 'status' && (
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

        {order.status === 'pending' && vendorAccepted && !deliveryAccepted && (
          <p className="text-center text-sm text-amber-600 dark:text-amber-400 py-2">
            You accepted. Waiting for delivery to accept...
          </p>
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
