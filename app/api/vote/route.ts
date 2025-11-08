import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = createAdminClient();

  try {
    const { shortlistId, activityId, voterName, voterIdentifier } = await request.json();

    if (!shortlistId || !activityId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if already voted
    const { data: existingVote } = await supabase
      .from('votes')
      .select('id')
      .eq('shortlist_id', shortlistId)
      .eq('activity_id', activityId)
      .eq('voter_identifier', voterIdentifier)
      .single();

    if (existingVote) {
      return NextResponse.json(
        { error: 'You already voted for this activity' },
        { status: 409 }
      );
    }

    // Create vote
    const { data, error } = await supabase
      .from('votes')
      .insert({
        shortlist_id: shortlistId,
        activity_id: activityId,
        voter_name: voterName || 'Anonymous',
        voter_identifier: voterIdentifier
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating vote:', error);
      return NextResponse.json(
        { error: 'Failed to record vote' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      vote: data
    });

  } catch (error) {
    console.error('Vote error:', error);
    return NextResponse.json(
      { error: 'Failed to record vote' },
      { status: 500 }
    );
  }
}
