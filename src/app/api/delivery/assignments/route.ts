import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const delivery_person_id = searchParams.get('delivery_person_id');

    let query = supabase
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
      .order('assigned_at', { ascending: false });

    if (delivery_person_id) {
      query = query.eq('delivery_person_id', delivery_person_id);
    }

    // Only show active assignments (not delivered)
    query = query.neq('status', 'delivered');

    const { data: assignments, error } = await query;

    if (error) {
      console.error('Assignments fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch assignments' },
        { status: 500 }
      );
    }

    return NextResponse.json({ assignments });
  } catch (error) {
    console.error('Assignments API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
