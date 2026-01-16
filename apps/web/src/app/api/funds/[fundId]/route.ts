import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { authMiddleware } from '@/lib/auth-middleware';
import type { NextRequest } from 'next/server';
import type { Params } from 'next/dist/shared/lib/router/utils/route-matcher';

// Fund detail query API (GET /api/funds/[fundId])
export async function GET(request: NextRequest, { params }: { params: Params }) {
  try {
    // Apply authentication middleware
    const authResponse = await authMiddleware(request);
    if (authResponse instanceof NextResponse && authResponse.status !== 200) {
      return authResponse;
    }

    // Get the fund ID from the URL parameters
    const fundId = params.fundId;

    if (!fundId) {
      return NextResponse.json(
        { error: 'Fund ID is required' },
        { status: 400 }
      );
    }

    // Fetch the fund details from the database
    const { data: fund, error } = await supabase
      .from('funds')
      .select('*')
      .eq('id', fundId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // Resource not found
        return NextResponse.json(
          { error: 'Fund not found' },
          { status: 404 }
        );
      }
      throw error;
    }

    // Fetch additional fund statistics if needed
    const { data: performance } = await supabase
      .from('fund_performance')
      .select('*')
      .eq('fund_id', fundId)
      .order('date', { ascending: false })
      .limit(30);

    return NextResponse.json({
      data: fund,
      performance: performance || []
    });
  } catch (error: any) {
    console.error('Fund detail query error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch fund details', details: error.message },
      { status: 500 }
    );
  }
}

// Fund update API (PUT /api/funds/[fundId])
export async function PUT(request: NextRequest, { params }: { params: Params }) {
  try {
    // Apply authentication middleware
    const authResponse = await authMiddleware(request);
    if (authResponse instanceof NextResponse && authResponse.status !== 200) {
      return authResponse;
    }

    // Get the fund ID from the URL parameters
    const fundId = params.fundId;

    if (!fundId) {
      return NextResponse.json(
        { error: 'Fund ID is required' },
        { status: 400 }
      );
    }

    // Get the update data from the request body
    const updateData = await request.json();

    // Update the fund in the database
    const { data: fund, error } = await supabase
      .from('funds')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', fundId)
      .select('*')
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // Resource not found
        return NextResponse.json(
          { error: 'Fund not found' },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json({
      data: fund,
      message: 'Fund updated successfully'
    });
  } catch (error: any) {
    console.error('Fund update error:', error);
    return NextResponse.json(
      { error: 'Failed to update fund', details: error.message },
      { status: 500 }
    );
  }
}