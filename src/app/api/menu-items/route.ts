import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth/guard';

export async function GET(request: NextRequest) {
  try {
    const { error: authError } = await getAuthenticatedUser();
    if (authError) return unauthorizedResponse();

    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const vendor_id = searchParams.get('vendor_id');

    if (!vendor_id) {
      return NextResponse.json({ error: 'vendor_id is required' }, { status: 400 });
    }

    const { data: items, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('vendor_id', vendor_id)
      .order('category', { ascending: true, nullsFirst: false })
      .order('name', { ascending: true });

    if (error) {
      console.error('Menu items fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch menu items' }, { status: 500 });
    }

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Menu items GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { error: authError } = await getAuthenticatedUser();
    if (authError) return unauthorizedResponse();

    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const vendor_id = searchParams.get('vendor_id');

    if (!vendor_id) {
      return NextResponse.json({ error: 'vendor_id is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('menu_items')
      .delete()
      .eq('vendor_id', vendor_id);

    if (error) {
      console.error('Menu items bulk delete error:', error);
      return NextResponse.json({ error: 'Failed to clear menu items' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Menu items DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { error: authError } = await getAuthenticatedUser();
    if (authError) return unauthorizedResponse();

    const supabase = await createClient();
    const body = await request.json();

    const { vendor_id, name, price, description, category, image_url, is_available } = body;

    if (!vendor_id || !name?.trim()) {
      return NextResponse.json({ error: 'vendor_id and name are required' }, { status: 400 });
    }

    if (price === undefined || price === null || typeof price !== 'number' || price < 0) {
      return NextResponse.json({ error: 'price must be a non-negative number' }, { status: 400 });
    }

    const { data: item, error } = await supabase
      .from('menu_items')
      .insert({
        vendor_id,
        name: name.trim(),
        description: description?.trim() || null,
        price,
        category: category?.trim() || null,
        image_url: image_url?.trim() || null,
        is_available: is_available ?? true,
      } as Record<string, unknown>)
      .select()
      .single();

    if (error) {
      console.error('Menu item create error:', error);
      return NextResponse.json({ error: 'Failed to create menu item' }, { status: 500 });
    }

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    console.error('Menu items POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
