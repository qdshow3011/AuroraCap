import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import type { NextRequest } from 'next/server';

// Comments list query API (GET /api/comments)
export async function GET(request: NextRequest) {
  try {
    // Get query parameters for filtering and pagination
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    const article_id = searchParams.get('article_id');

    // Build the query
    let query = supabase.from('comments').select('*, user:user_id(*)');

    // Apply article filter if provided
    if (article_id) {
      query = query.eq('article_id', article_id);
    }

    // Apply pagination and sort by latest
    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    // Execute the query
    const { data: comments, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      data: comments || [],
      meta: {
        limit,
        offset
      }
    });
  } catch (error: any) {
    console.error('Comments list query error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments', details: error.message },
      { status: 500 }
    );
  }
}

// Create comment API (POST /api/comments)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { article_id, content, user_id } = body;

    if (!article_id || !content || !user_id) {
      return NextResponse.json(
        { error: 'article_id, content, and user_id are required' },
        { status: 400 }
      );
    }

    // Create the comment
    const { data: comment, error } = await supabase
      .from('comments')
      .insert({
        article_id,
        content,
        user_id
      })
      .select('*, user:user_id(*)')
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ data: comment });
  } catch (error: any) {
    console.error('Create comment error:', error);
    return NextResponse.json(
      { error: 'Failed to create comment', details: error.message },
      { status: 500 }
    );
  }
}
