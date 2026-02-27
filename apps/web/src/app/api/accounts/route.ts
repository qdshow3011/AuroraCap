import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import type { NextRequest } from 'next/server';

// Accounts list query API (GET /api/accounts)
export async function GET(request: NextRequest) {
  try {
    // Get query parameters for filtering and pagination
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search');

    // Build the query
    let query = supabase.from('wechat_official_accounts').select('*', { count: 'exact' });

    // Apply search filter if provided
    if (search && search.trim()) {
      const trimmedSearch = search.trim();
      const searchPattern = `%${trimmedSearch}%`;
      query = query.ilike('name', searchPattern);
    }

    // Apply pagination and sort by latest
    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    // Execute the query
    const { data: accounts, error, count } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      data: accounts || [],
      meta: {
        limit,
        offset,
        total: count || 0
      }
    });
  } catch (error: any) {
    console.error('Accounts list query error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch accounts', details: error.message },
      { status: 500 }
    );
  }
}

// Create account API (POST /api/accounts)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, avatar, user_id } = body;

    if (!name || !user_id) {
      return NextResponse.json(
        { error: 'Name and user_id are required' },
        { status: 400 }
      );
    }

    // Create the account
    const { data: account, error } = await supabase
      .from('wechat_official_accounts')
      .insert({
        name,
        description,
        avatar,
        user_id
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ data: account });
  } catch (error: any) {
    console.error('Create account error:', error);
    return NextResponse.json(
      { error: 'Failed to create account', details: error.message },
      { status: 500 }
    );
  }
}
