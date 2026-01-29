'use client';

import { Check, Clock, ChefHat, Package, Truck, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { OrderStatus } from '@/lib/supabase/types';

const statusSteps: {
  status: OrderStatus;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { status: 'pending', label: 'Order Placed', icon: Clock },
  { status: 'confirmed', label: 'Confirmed', icon: Check },
  { status: 'preparing', label: 'Preparing', icon: ChefHat },
  { status: 'ready', label: 'Ready', icon: Package },
  { status: 'picked_up', label: 'Picked Up', icon: Truck },
  { status: 'delivered', label: 'Delivered', icon: Home },
];

const statusIndex: Record<OrderStatus, number> = {
  pending: 0,
  confirmed: 1,
  preparing: 2,
  ready: 3,
  picked_up: 4,
  delivered: 5,
  cancelled: -1,
};

interface OrderStatusDisplayProps {
  status: OrderStatus;
  className?: string;
}

export function OrderStatusDisplay({ status, className }: OrderStatusDisplayProps) {
  const currentIndex = statusIndex[status];

  if (status === 'cancelled') {
    return (
      <div className={cn('p-4 bg-red-50 dark:bg-red-950 rounded-lg text-center', className)}>
        <p className="text-red-600 dark:text-red-400 font-medium">Order Cancelled</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {statusSteps.map((step, index) => {
        const Icon = step.icon;
        const isCompleted = index <= currentIndex;
        const isCurrent = index === currentIndex;

        return (
          <div key={step.status} className="flex items-center gap-4">
            <div
              className={cn(
                'flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors',
                isCompleted
                  ? 'bg-green-500 border-green-500 text-white'
                  : 'border-gray-300 dark:border-gray-600 text-gray-400'
              )}
            >
              <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p
                className={cn(
                  'font-medium',
                  isCompleted
                    ? 'text-gray-900 dark:text-gray-100'
                    : 'text-gray-400 dark:text-gray-500'
                )}
              >
                {step.label}
              </p>
              {isCurrent && (
                <p className="text-sm text-green-600 dark:text-green-400 animate-pulse">
                  In progress...
                </p>
              )}
            </div>
            {isCompleted && index < currentIndex && (
              <Check className="w-5 h-5 text-green-500" />
            )}
          </div>
        );
      })}
    </div>
  );
}

interface OrderStatusBadgeProps {
  status: OrderStatus;
}

const statusColors: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  preparing: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  ready: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  picked_up: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
  delivered: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

const statusLabels: Record<OrderStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready: 'Ready for Pickup',
  picked_up: 'Picked Up',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        statusColors[status]
      )}
    >
      {statusLabels[status]}
    </span>
  );
}
