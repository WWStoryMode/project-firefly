import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Order, DeliveryPerson } from '@/lib/supabase/types';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const { vendor_id, items, delivery_address, delivery_notes, customer_id } = body;

    // Validate required fields
    if (!vendor_id || !items?.length || !delivery_address || !customer_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Calculate total
    const total_amount = items.reduce(
      (sum: number, item: { unit_price: number; quantity: number }) =>
        sum + item.unit_price * item.quantity,
      0
    );

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_id,
        vendor_id,
        status: 'pending',
        total_amount,
        delivery_address,
        delivery_notes,
      } as Record<string, unknown>)
      .select()
      .single() as { data: Order | null; error: unknown };

    if (orderError || !order) {
      console.error('Order creation error:', orderError);
      return NextResponse.json(
        { error: 'Failed to create order' },
        { status: 500 }
      );
    }

    // Create order items
    const orderItems = items.map((item: {
      menu_item_id: string;
      name: string;
      quantity: number;
      unit_price: number;
      notes?: string;
    }) => ({
      order_id: order.id,
      menu_item_id: item.menu_item_id,
      name: item.name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      notes: item.notes,
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems as Record<string, unknown>[]);

    if (itemsError) {
      console.error('Order items error:', itemsError);
      // Order was created but items failed - still return order
    }

    // Find available delivery person and create assignment
    const { data: deliveryPerson } = await supabase
      .from('delivery_persons')
      .select('id')
      .eq('is_active', true)
      .eq('is_available', true)
      .limit(1)
      .single() as { data: Pick<DeliveryPerson, 'id'> | null };

    if (deliveryPerson) {
      // Create delivery assignment
      await supabase
        .from('delivery_assignments')
        .insert({
          order_id: order.id,
          delivery_person_id: deliveryPerson.id,
          status: 'pending',
        } as Record<string, unknown>);

      // Update order with delivery person
      await supabase
        .from('orders')
        .update({ delivery_person_id: deliveryPerson.id } as Record<string, unknown>)
        .eq('id', order.id);
    }

    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    console.error('Order API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const vendor_id = searchParams.get('vendor_id');
    const customer_id = searchParams.get('customer_id');
    const delivery_person_id = searchParams.get('delivery_person_id');

    let query = supabase
      .from('orders')
      .select(`
        *,
        vendor:vendors(*),
        items:order_items(*)
      `)
      .order('created_at', { ascending: false });

    if (vendor_id) {
      query = query.eq('vendor_id', vendor_id);
    }
    if (customer_id) {
      query = query.eq('customer_id', customer_id);
    }
    if (delivery_person_id) {
      query = query.eq('delivery_person_id', delivery_person_id);
    }

    const { data: orders, error } = await query;

    if (error) {
      console.error('Orders fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch orders' },
        { status: 500 }
      );
    }

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Orders API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
