import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { linkId: string } }
) {
  const supabase = createAdminClient();

  try {
    const { linkId } = params;

    // Get shortlist
    const { data: shortlist, error: shortlistError } = await supabase
      .from('shortlists')
      .select('*')
      .eq('unique_link_id', linkId)
      .single();

    if (shortlistError || !shortlist) {
      return NextResponse.json(
        { error: 'Shortlist not found' },
        { status: 404 }
      );
    }

    // Check if expired
    if (new Date(shortlist.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'This shortlist has expired' },
        { status: 410 }
      );
    }

    // Get activities
    const { data: activities, error: activitiesError } = await supabase
      .from('generated_activities')
      .select('*')
      .in('id', shortlist.activities);

    if (activitiesError) {
      console.error('Error fetching activities:', activitiesError);
    }

    // Get votes
    const { data: votes, error: votesError } = await supabase
      .from('votes')
      .select('*')
      .eq('shortlist_id', shortlist.id);

    if (votesError) {
      console.error('Error fetching votes:', votesError);
    }

    return NextResponse.json({
      success: true,
      shortlist: {
        ...shortlist,
        activities: activities || [],
        votes: votes || []
      }
    });

  } catch (error) {
    console.error('Get shortlist error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shortlist' },
      { status: 500 }
    );
  }
}
