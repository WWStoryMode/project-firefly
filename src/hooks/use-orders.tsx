'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Order, OrderWithDetails, DeliveryAssignment } from '@/lib/supabase/types';

// Hook for real-time order updates
export function useOrderRealtime(orderId: string) {
  const [order, setOrder] = useState<OrderWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    // Initial fetch
    const fetchOrder = async () => {
      const { data, error: fetchError } = await supabase
        .from('orders')
        .select(`
          *,
          vendor:vendors(*),
          items:order_items(*)
        `)
        .eq('id', orderId)
        .single();

      if (fetchError) {
        setError(fetchError.message);
      } else {
        setOrder(data as unknown as OrderWithDetails);
      }
      setLoading(false);
    };

    fetchOrder();

    // Subscribe to changes
    const channel = supabase
      .channel(`order-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          setOrder((prev) =>
            prev ? { ...prev, ...payload.new } : null
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  return { order, loading, error };
}

// Hook for vendor order queue
export function useVendorOrders(vendorId: string) {
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const supabase = createClient();
    const { data, error: fetchError } = await supabase
      .from('orders')
      .select(`
        *,
        vendor:vendors(*),
        items:order_items(*),
        customer:users!orders_customer_id_fkey(name, phone)
      `)
      .eq('vendor_id', vendorId)
      .in('status', ['pending', 'confirmed', 'preparing', 'ready'])
      .order('created_at', { ascending: true });

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setOrders(data as unknown as OrderWithDetails[]);
    }
    setLoading(false);
  }, [vendorId]);

  useEffect(() => {
    const supabase = createClient();

    refresh();

    // Subscribe to new orders and updates
    const channel = supabase
      .channel(`vendor-orders-${vendorId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `vendor_id=eq.${vendorId}`,
        },
        () => {
          refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [vendorId, refresh]);

  return { orders, loading, error, refresh };
}

// Hook for delivery assignments
export function useDeliveryAssignments(deliveryPersonId: string) {
  const [assignments, setAssignments] = useState<(DeliveryAssignment & { order: OrderWithDetails })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const supabase = createClient();
    const { data, error: fetchError } = await supabase
      .from('delivery_assignments')
      .select(`
        *,
        order:orders(
          *,
          vendor:vendors(*),
          items:order_items(*),
          customer:users!orders_customer_id_fkey(name, phone)
        )
      `)
      .eq('delivery_person_id', deliveryPersonId)
      .neq('status', 'delivered')
      .order('assigned_at', { ascending: true });

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setAssignments(data as unknown as (DeliveryAssignment & { order: OrderWithDetails })[]);
    }
    setLoading(false);
  }, [deliveryPersonId]);

  useEffect(() => {
    const supabase = createClient();

    refresh();

    // Subscribe to assignment changes
    const channel = supabase
      .channel(`delivery-assignments-${deliveryPersonId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'delivery_assignments',
          filter: `delivery_person_id=eq.${deliveryPersonId}`,
        },
        () => {
          refresh();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
        },
        () => {
          refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [deliveryPersonId, refresh]);

  return { assignments, loading, error, refresh };
}

// Update order status
export async function updateOrderStatus(orderId: string, status: Order['status']) {
  const response = await fetch(`/api/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update order status');
  }

  return response.json();
}

// Update delivery assignment status
export async function updateAssignmentStatus(
  assignmentId: string,
  status: 'accepted' | 'picked_up' | 'delivered'
) {
  const response = await fetch(`/api/delivery/assignments/${assignmentId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update assignment status');
  }

  return response.json();
}
