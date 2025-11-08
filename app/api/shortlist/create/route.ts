import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { nanoid } from 'nanoid';

export async function POST(request: NextRequest) {
  const supabase = createAdminClient();

  try {
    const { activityIds, eventTitle, organizerEmail, organizerName } = await request.json();

    if (!activityIds || !Array.isArray(activityIds) || activityIds.length === 0) {
      return NextResponse.json(
        { error: 'Please select at least one activity' },
        { status: 400 }
      );
    }

    if (activityIds.length > 5) {
      return NextResponse.json(
        { error: 'Maximum 5 activities allowed in shortlist' },
        { status: 400 }
      );
    }

    // Generate unique link ID
    const linkId = nanoid(10);

    // Create shortlist
    const { data, error } = await supabase
      .from('shortlists')
      .insert({
        unique_link_id: linkId,
        event_title: eventTitle,
        organizer_email: organizerEmail,
        organizer_name: organizerName,
        activities: activityIds
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating shortlist:', error);
      return NextResponse.json(
        { error: 'Failed to create shortlist' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      shortlistId: data.id,
      linkId: data.unique_link_id,
      shareUrl: `${process.env.NEXT_PUBLIC_APP_URL}/vote/${data.unique_link_id}`
    });

  } catch (error) {
    console.error('Shortlist creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create shortlist' },
      { status: 500 }
    );
  }
}
