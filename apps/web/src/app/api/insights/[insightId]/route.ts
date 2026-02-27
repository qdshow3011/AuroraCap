import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import type { NextRequest } from 'next/server';

// Insight detail query API (GET /api/insights/[insightId])
export async function GET(request: NextRequest, { params }: { params: { insightId: string } }) {
  try {

    const { insightId } = params;

    // Get the insight by ID
    const { data: insight, error } = await supabase
      .from('internal_references')
      .select('*, account:account_id(*)')
      .eq('id', insightId)
      .single();

    if (error) {
      throw error;
    }

    if (!insight) {
      return NextResponse.json(
        { error: 'Insight not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: insight });
  } catch (error: any) {
    console.error('Insight detail query error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch insight', details: error.message },
      { status: 500 }
    );
  }
}
