import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth/guard';

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

    const updates: Record<string, unknown> = {};

    if (body.name !== undefined) updates.name = body.name?.trim();
    if (body.description !== undefined) updates.description = body.description?.trim() || null;
    if (body.category !== undefined) updates.category = body.category?.trim() || null;
    if (body.image_url !== undefined) updates.image_url = body.image_url?.trim() || null;
    if (body.is_available !== undefined) updates.is_available = body.is_available;

    if (body.price !== undefined) {
      if (typeof body.price !== 'number' || body.price < 0) {
        return NextResponse.json({ error: 'price must be a non-negative number' }, { status: 400 });
      }
      updates.price = body.price;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const { data: item, error } = await supabase
      .from('menu_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Menu item update error:', error);
      return NextResponse.json({ error: 'Failed to update menu item' }, { status: 500 });
    }

    return NextResponse.json({ item });
  } catch (error) {
    console.error('Menu item PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
