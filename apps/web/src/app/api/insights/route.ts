import { NextResponse } from 'next/server';
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

    // Return mock data for build process
    return NextResponse.json({
      data: [],
      meta: {
        limit,
        offset,
        total: 0,
        categories: []
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
