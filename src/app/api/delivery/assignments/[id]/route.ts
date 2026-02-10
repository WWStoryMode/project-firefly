import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth/guard';
import type { DeliveryAssignmentStatus, OrderStatus, DeliveryAssignment, Order } from '@/lib/supabase/types';

// Map assignment status to order status (for picked_up and delivered only)
// 'accepted' now requires AND logic with vendor_accepted
const statusToOrderStatus: Record<string, OrderStatus> = {
  picked_up: 'picked_up',
  delivered: 'delivered',
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error: authError, isDemoMode } = await getAuthenticatedUser();
    if (!isDemoMode && authError) return unauthorizedResponse();

    const { id } = await params;
    const supabase = await createClient();
    const body = await request.json();

    const { status } = body as { status: DeliveryAssignmentStatus };

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    // Get assignment and order (including vendor_accepted flag)
    const { data: assignment, error: fetchError } = await supabase
      .from('delivery_assignments')
      .select('*, order:orders(id, status, vendor_accepted)')
      .eq('id', id)
      .single() as { data: (DeliveryAssignment & { order: Pick<Order, 'id' | 'status'> & { vendor_accepted: boolean } }) | null; error: unknown };

    if (fetchError || !assignment) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      );
    }

    // Build update object with timestamps
    const updateData: Record<string, unknown> = { status };
    const now = new Date().toISOString();

    if (status === 'accepted') {
      updateData.accepted_at = now;
    } else if (status === 'picked_up') {
      updateData.picked_up_at = now;
    } else if (status === 'delivered') {
      updateData.delivered_at = now;
    }

    // Update assignment
    const { data: updatedAssignment, error: updateError } = await supabase
      .from('delivery_assignments')
      .update(updateData)
      .eq('id', id)
      .select()
      .single() as { data: DeliveryAssignment | null; error: unknown };

    if (updateError) {
      console.error('Assignment update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update assignment' },
        { status: 500 }
      );
    }

    // Handle order status updates
    if (assignment.order_id) {
      if (status === 'accepted') {
        // AND logic: only set order to 'confirmed' if vendor has also accepted
        const vendorAccepted = assignment.order?.vendor_accepted;
        if (vendorAccepted) {
          await supabase
            .from('orders')
            .update({ status: 'confirmed' } as Record<string, unknown>)
            .eq('id', assignment.order_id);
        }
        // If vendor hasn't accepted yet, order stays 'pending'
        return NextResponse.json({
          assignment: updatedAssignment,
          awaiting_vendor: !vendorAccepted
        });
      } else {
        // For picked_up and delivered, update order status directly
        const orderStatus = statusToOrderStatus[status];
        if (orderStatus) {
          await supabase
            .from('orders')
            .update({ status: orderStatus } as Record<string, unknown>)
            .eq('id', assignment.order_id);
        }
      }
    }

    return NextResponse.json({ assignment: updatedAssignment });
  } catch (error) {
    console.error('Assignment API error:', error);
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
    const { error: authError, isDemoMode } = await getAuthenticatedUser();
    if (!isDemoMode && authError) return unauthorizedResponse();

    const { id } = await params;
    const supabase = await createClient();

    const { data: assignment, error } = await supabase
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
      .eq('id', id)
      .single();

    if (error || !assignment) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ assignment });
  } catch (error) {
    console.error('Assignment fetch API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
