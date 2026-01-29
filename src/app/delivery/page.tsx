'use client';

import { useState } from 'react';
import { Bike, Clock, MapPin, Store, Package, Truck, Home, Loader2, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { OrderStatusBadge } from '@/components/order-status';
import { useDeliveryAssignments, updateAssignmentStatus } from '@/hooks/use-orders';
import type { DeliveryAssignment, OrderWithDetails } from '@/lib/supabase/types';

// Demo delivery person ID - in real app this would come from auth
const DEMO_DELIVERY_PERSON_ID = '30000000-0000-0000-0000-000000000001';

export default function DeliveryDashboard() {
  const { assignments, loading, error } = useDeliveryAssignments(DEMO_DELIVERY_PERSON_ID);
  const [updating, setUpdating] = useState<string | null>(null);

  const handleStatusUpdate = async (
    assignmentId: string,
    newStatus: 'accepted' | 'picked_up' | 'delivered'
  ) => {
    setUpdating(assignmentId);
    try {
      await updateAssignmentStatus(assignmentId, newStatus);
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
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Loading assignments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-blue-600 text-white">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Bike className="w-6 h-6" />
            <div>
              <h1 className="text-xl font-bold">Delivery Dashboard</h1>
              <p className="text-sm text-blue-100">Alex Johnson</p>
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
            Active Deliveries
          </h2>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {assignments.length} {assignments.length === 1 ? 'delivery' : 'deliveries'}
          </span>
        </div>

        {assignments.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Clock className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                No deliveries assigned. Waiting for orders...
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {assignments.map((assignment) => (
              <AssignmentCard
                key={assignment.id}
                assignment={assignment}
                updating={updating === assignment.id}
                onStatusUpdate={handleStatusUpdate}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

interface AssignmentCardProps {
  assignment: DeliveryAssignment & { order: OrderWithDetails };
  updating: boolean;
  onStatusUpdate: (
    assignmentId: string,
    status: 'accepted' | 'picked_up' | 'delivered'
  ) => void;
}

function AssignmentCard({ assignment, updating, onStatusUpdate }: AssignmentCardProps) {
  const order = assignment.order;

  const getNextAction = () => {
    switch (assignment.status) {
      case 'pending':
        return { label: 'Accept Delivery', status: 'accepted' as const, icon: Check };
      case 'accepted':
        if (order.status === 'ready') {
          return { label: 'Mark Picked Up', status: 'picked_up' as const, icon: Truck };
        }
        return null; // Waiting for order to be ready
      case 'picked_up':
        return { label: 'Mark Delivered', status: 'delivered' as const, icon: Home };
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
              Assigned {new Date(assignment.assigned_at).toLocaleTimeString()}
            </p>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>
      </CardHeader>
      <CardContent>
        {/* Pickup Location */}
        <div className="flex items-start gap-3 mb-4">
          <Store className="w-5 h-5 text-amber-500 mt-0.5" />
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Pickup from</p>
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

        {/* Delivery Location */}
        <div className="flex items-start gap-3 mb-4">
          <MapPin className="w-5 h-5 text-blue-500 mt-0.5" />
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Deliver to</p>
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

        <Separator className="my-3" />

        {/* Order Summary */}
        <div className="space-y-2 mb-4">
          {order.items?.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-300">
                {item.quantity}x {item.name}
              </span>
            </div>
          ))}
        </div>

        <div className="flex justify-between font-medium mb-4">
          <span>Collect on Delivery</span>
          <span className="text-green-600 dark:text-green-400">
            ${Number(order.total_amount).toFixed(2)}
          </span>
        </div>

        {/* Status Message */}
        {assignment.status === 'accepted' && order.status !== 'ready' && (
          <div className="bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 p-3 rounded-lg text-center text-sm mb-4">
            <Package className="w-4 h-4 inline mr-2" />
            Waiting for vendor to prepare order...
          </div>
        )}

        {nextAction && (
          <Button
            className="w-full bg-blue-600 hover:bg-blue-700"
            onClick={() => onStatusUpdate(assignment.id, nextAction.status)}
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
      </CardContent>
    </Card>
  );
}
