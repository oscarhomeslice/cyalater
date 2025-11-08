import { NextRequest, NextResponse } from 'next/server';
import { generateActivityQuery, generateActivityRecommendations } from '@/lib/openai-helper';
import { getNearbyAttractions } from '@/lib/tripadvisor-helper';

export async function POST(request: NextRequest) {
  try {
    const { userInput } = await request.json();

    if (!userInput || userInput.length < 20) {
      return NextResponse.json(
        { error: 'Please provide more details about your group activity' },
        { status: 400 }
      );
    }

    // Step 1: Use OpenAI to parse user intent
    console.log('Parsing user input...');
    const parsedQuery = await generateActivityQuery(userInput);
    console.log('Parsed query:', parsedQuery);

    // Step 2: Query TripAdvisor based on parsed intent
    console.log('Searching TripAdvisor...');
    const location = parsedQuery.location || 'popular destinations';
    const tripAdvisorResults = await getNearbyAttractions(location, 'attractions');
    
    console.log(`Found ${tripAdvisorResults.length} activities from TripAdvisor`);

    // Step 3: Use OpenAI to generate recommendations from TripAdvisor results
    console.log('Generating personalized recommendations...');
    const recommendations = await generateActivityRecommendations(
      userInput,
      tripAdvisorResults
    );

    // Step 4: Return formatted response
    return NextResponse.json({
      success: true,
      query: parsedQuery,
      recommendations
    });

  } catch (error: any) {
    console.error('API Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to generate activity suggestions',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// Rate limiting helper (optional but recommended)
const rateLimit = new Map();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const userRequests = rateLimit.get(ip) || [];
  
  // Filter requests from last minute
  const recentRequests = userRequests.filter((time: number) => now - time < 60000);
  
  if (recentRequests.length >= 5) {
    return false; // Too many requests
  }
  
  recentRequests.push(now);
  rateLimit.set(ip, recentRequests);
  return true;
}