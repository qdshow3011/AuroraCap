import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { authMiddleware } from '@/lib/auth-middleware';
import { hasRole } from '@/lib/auth-middleware';
import type { NextRequest } from 'next/server';

// Fund NAV update API (PUT /api/funds/update-nav)
export async function PUT(request: NextRequest) {
  try {
    // Apply authentication middleware
    const authResponse = await authMiddleware(request);
    if (authResponse instanceof NextResponse && authResponse.status !== 200) {
      return authResponse;
    }

    // Check if user has admin role
    const roleResponse = await hasRole('ADMIN')(request);
    if (roleResponse instanceof NextResponse && roleResponse.status !== 200) {
      return roleResponse;
    }

    // Parse request body
    const body = await request.json();
    const { fund_id, nav, daily_return, weekly_return, monthly_return, annual_return } = body;

    // Validate required fields
    if (!fund_id || nav === undefined || nav === null) {
      return NextResponse.json(
        { error: 'Fund ID and NAV are required' },
        { status: 400 }
      );
    }

    // Check if the fund exists
    const { data: existingFund, error: fundError } = await supabase
      .from('funds')
      .select('id')
      .eq('id', fund_id)
      .single();

    if (fundError || !existingFund) {
      return NextResponse.json(
        { error: 'Fund not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {
      nav,
      updated_at: new Date().toISOString()
    };

    // Add optional fields if provided
    if (daily_return !== undefined) updateData.daily_return = daily_return;
    if (weekly_return !== undefined) updateData.weekly_return = weekly_return;
    if (monthly_return !== undefined) updateData.monthly_return = monthly_return;
    if (annual_return !== undefined) updateData.annual_return = annual_return;

    // Update the fund's NAV and performance data
    const { error: updateError } = await supabase
      .from('funds')
      .update(updateData)
      .eq('id', fund_id);

    if (updateError) {
      throw updateError;
    }

    // Get the updated fund data
    const { data: updatedFund } = await supabase
      .from('funds')
      .select('*')
      .eq('id', fund_id)
      .single();

    // Add historical NAV record
    await supabase.from('fund_nav_history').insert({
      fund_id,
      nav,
      date: new Date().toISOString(),
      created_at: new Date().toISOString()
    });

    return NextResponse.json({
      message: 'Fund NAV updated successfully',
      data: updatedFund
    });

  } catch (error: any) {
    console.error('Fund NAV update error:', error);
    return NextResponse.json(
      { error: 'Failed to update fund NAV', details: error.message },
      { status: 500 }
    );
  }
}

// Get fund NAV history API (GET /api/funds/update-nav?fund_id=xxx)
export async function GET(request: NextRequest) {
  try {
    // Apply authentication middleware
    const authResponse = await authMiddleware(request);
    if (authResponse instanceof NextResponse && authResponse.status !== 200) {
      return authResponse;
    }

    const { searchParams } = new URL(request.url);
    const fundId = searchParams.get('fund_id');
    const limit = parseInt(searchParams.get('limit') || '30');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    if (!fundId) {
      return NextResponse.json(
        { error: 'Fund ID is required' },
        { status: 400 }
      );
    }

    // Get NAV history
    const { data: navHistory, error, count } = await supabase
      .from('fund_nav_history')
      .select('*', { count: 'exact' })
      .eq('fund_id', fundId)
      .order('date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      data: navHistory || [],
      meta: {
        limit,
        offset,
        total: count || 0
      }
    });

  } catch (error: any) {
    console.error('Fund NAV history error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch NAV history', details: error.message },
      { status: 500 }
    );
  }
}
