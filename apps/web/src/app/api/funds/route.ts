import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { authMiddleware } from '@/lib/auth-middleware';
import type { NextRequest } from 'next/server';

// Fund list query API (GET /api/funds)
export async function GET(request: NextRequest) {
  try {
    // Apply authentication middleware
    const authResponse = await authMiddleware(request);
    if (authResponse instanceof NextResponse && authResponse.status !== 200) {
      return authResponse;
    }

    // Get query parameters for filtering and pagination
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    const category = searchParams.get('category');

    // Build the query
    let query = supabase.from('funds').select('*', { count: 'exact' });

    // Apply filters if provided
    if (category) {
      query = query.eq('category', category);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    // Execute the query
    const { data: funds, error, count } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      data: funds,
      meta: {
        limit,
        offset,
        total: count || 0,
        categories: await getFundCategories()
      }
    });
  } catch (error: any) {
    console.error('Fund list query error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch funds', details: error.message },
      { status: 500 }
    );
  }
}

// Helper function to get all unique fund categories
async function getFundCategories() {
  const { data, error } = await supabase
    .from('funds')
    .select('category');
  
  if (error) {
    console.error('Get fund categories error:', error);
    return [];
  }
  
  // Format the data to return just the unique category values
  const categoryMap = new Set<string>();
  data?.forEach(item => {
    if (item.category) {
      categoryMap.add(item.category);
    }
  });
  
  return Array.from(categoryMap);
}