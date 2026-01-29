import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { DeliveryAssignmentStatus, OrderStatus, DeliveryAssignment } from '@/lib/supabase/types';

// Map assignment status to order status
const statusToOrderStatus: Record<DeliveryAssignmentStatus, OrderStatus> = {
  pending: 'pending',
  accepted: 'confirmed',
  picked_up: 'picked_up',
  delivered: 'delivered',
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

    // Get assignment and order
    const { data: assignment, error: fetchError } = await supabase
      .from('delivery_assignments')
      .select('*, order:orders(*)')
      .eq('id', id)
      .single() as { data: (DeliveryAssignment & { order: { id: string } }) | null; error: unknown };

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

    // Update order status based on assignment status
    const orderStatus = statusToOrderStatus[status];
    if (orderStatus && assignment.order_id) {
      await supabase
        .from('orders')
        .update({ status: orderStatus } as Record<string, unknown>)
        .eq('id', assignment.order_id);
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
