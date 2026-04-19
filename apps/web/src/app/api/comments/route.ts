import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Comments list query API (GET /api/comments)
export async function GET(request: NextRequest) {
  try {
    // Get query parameters for filtering and pagination
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    const article_id = searchParams.get('article_id');

    // Return mock data for build process
    return NextResponse.json({
      data: [],
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

    // Return mock data for build process
    return NextResponse.json({ 
      data: {
        id: 'mock-comment-id',
        article_id,
        content,
        user_id,
        created_at: new Date().toISOString(),
        user: {
          id: user_id,
          email: 'mock@example.com',
          name: 'Mock User'
        }
      }
    });
  } catch (error: any) {
    console.error('Create comment error:', error);
    return NextResponse.json(
      { error: 'Failed to create comment', details: error.message },
      { status: 500 }
    );
  }
}
