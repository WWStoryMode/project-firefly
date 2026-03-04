import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth/guard';
import type { OrderStatus, Order, DeliveryAssignment } from '@/lib/supabase/types';

// Valid status transitions
const validTransitions: Record<OrderStatus, OrderStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['picked_up', 'cancelled'],
  picked_up: ['delivered'],
  delivered: [],
  cancelled: [],
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error: authError } = await getAuthenticatedUser();
    if (authError) return unauthorizedResponse();

    const { id } = await params;
    const supabase = await createClient();
    const body = await request.json();

    const { status, vendor_accept } = body as { status?: OrderStatus; vendor_accept?: boolean };

    // Get current order with delivery assignment
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('status, vendor_accepted, delivery_assignments(*)')
      .eq('id', id)
      .single() as { data: (Pick<Order, 'status'> & { vendor_accepted: boolean; delivery_assignments: DeliveryAssignment[] }) | null; error: unknown };

    if (fetchError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Handle vendor acceptance (AND logic with delivery)
    if (vendor_accept) {
      const deliveryAssignment = order.delivery_assignments?.[0];
      const deliveryAccepted = deliveryAssignment?.status === 'accepted';

      // Set vendor_accepted to true
      const updateData: Record<string, unknown> = { vendor_accepted: true };

      // Only set status to confirmed if delivery has also accepted
      if (deliveryAccepted) {
        updateData.status = 'confirmed';
      }

      const { data: updatedOrder, error: updateError } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', id)
        .select()
        .single() as { data: Order | null; error: unknown };

      if (updateError) {
        console.error('Order update error:', updateError);
        return NextResponse.json(
          { error: 'Failed to update order' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        order: updatedOrder,
        awaiting_delivery: !deliveryAccepted
      });
    }

    // Handle regular status transitions
    if (!status) {
      return NextResponse.json(
        { error: 'Status or vendor_accept is required' },
        { status: 400 }
      );
    }

    // Validate transition
    const currentStatus = order.status as OrderStatus;
    if (!validTransitions[currentStatus]?.includes(status)) {
      return NextResponse.json(
        { error: `Cannot transition from ${currentStatus} to ${status}` },
        { status: 400 }
      );
    }

    // Update order status
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({ status } as Record<string, unknown>)
      .eq('id', id)
      .select()
      .single() as { data: Order | null; error: unknown };

    if (updateError) {
      console.error('Order update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update order' },
        { status: 500 }
      );
    }

    return NextResponse.json({ order: updatedOrder });
  } catch (error) {
    console.error('Order status API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error: authError } = await getAuthenticatedUser();
    if (authError) return unauthorizedResponse();

    const { id } = await params;
    const supabase = await createClient();

    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        *,
        vendor:vendors(*),
        items:order_items(*),
        delivery_assignment:delivery_assignments(*)
      `)
      .eq('id', id)
      .single();

    if (error || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error('Order fetch API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
