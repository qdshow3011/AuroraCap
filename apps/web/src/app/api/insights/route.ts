import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import type { NextRequest } from 'next/server';

// Mock AI summary generation function
// In production, this would call a real AI service like OpenAI or Anthropic
function generateAISummary(content: string): string {
  // Remove HTML tags if any
  const plainText = content.replace(/<[^>]*>/g, '');
  
  // Remove extra whitespace
  const cleanedText = plainText.replace(/\s+/g, ' ').trim();
  
  // If content is already short, return as is
  if (cleanedText.length <= 80) {
    return cleanedText;
  }
  
  // Extract key sentences (simplified implementation)
  // In a real AI implementation, this would use NLP to extract key information
  const sentences = cleanedText.split(/[。！？]/).filter(sentence => sentence.trim().length > 0);
  
  let summary = '';
  let currentLength = 0;
  
  // Build summary by adding sentences until we reach 80 characters
  for (const sentence of sentences) {
    const sentenceWithPunctuation = sentence + '。';
    const newLength = currentLength + sentenceWithPunctuation.length;
    
    if (newLength <= 80) {
      summary += sentenceWithPunctuation;
      currentLength = newLength;
    } else {
      // If adding the full sentence would exceed 80 chars, truncate and add ellipsis
      if (currentLength === 0) {
        // If even the first sentence is too long, truncate it
        summary = sentence.substring(0, 77) + '...';
      } else {
        // Otherwise, just end with what we have
        break;
      }
    }
  }
  
  return summary.trim();
}

// Insights list query API (GET /api/insights)
export async function GET(request: NextRequest) {
  try {

    // Get query parameters for filtering and pagination
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    // Build the query
    let query = supabase.from('internal_references').select('*, account:account_id(*)');


    // Apply filters if provided
    if (category) {
      query = query.eq('category', category);
    }
    // Only search if search term is not empty or just whitespace
    if (search && search.trim()) {
      const trimmedSearch = search.trim();
      const searchPattern = `%${trimmedSearch}%`;
      // Only search in title field to avoid complex .or() syntax that causes parsing errors
      query = query.ilike('title', searchPattern);
    }

    // Apply pagination and sort by latest
    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    // Execute the query
    const { data: insights, error, count } = await query;

    if (error) {
      throw error;
    }

    // Process insights to generate AI summaries if needed
    const processedInsights = insights?.map(insight => {
      // If no summary or description exists, generate an AI summary from content
      if (!insight.summary && !insight.description && insight.content) {
        const aiSummary = generateAISummary(insight.content);
        return { ...insight, summary: aiSummary };
      }
      // If only description exists, use it as summary
      if (!insight.summary && insight.description) {
        return { ...insight, summary: insight.description };
      }
      return insight;
    }) || [];

    return NextResponse.json({
      data: processedInsights,
      meta: {
        limit,
        offset,
        total: count || 0,
        categories: await getInsightCategories()
      }
    });
  } catch (error: any) {
    console.error('Insights list query error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch insights', details: error.message },
      { status: 500 }
    );
  }
}

// Helper function to get all unique insight categories
async function getInsightCategories() {
  const { data, error } = await supabase
    .from('internal_references')
    .select('category');

  if (error) {
    console.error('Get insight categories error:', error);
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
