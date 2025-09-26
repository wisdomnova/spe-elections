// app/api/vote/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { getSession, SessionData } from '@/lib/auth';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

interface VoteRequest {
  candidateId: string;
  position: string;
}

interface VoteResponse {
  success: boolean;
  hasCompletedVoting: boolean;
  redirect?: string;
}

interface ErrorResponse {
  error: string;
  message: string;
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json<ErrorResponse>({ 
        error: 'Unauthorized',
        message: 'Please login to vote' 
      }, { status: 401 });
    }

    const { candidateId, position }: VoteRequest = await request.json();
    if (!candidateId || !position) {
      return NextResponse.json<ErrorResponse>({ 
        error: 'Bad Request',
        message: 'Candidate ID and position are required' 
      }, { status: 400 });
    }

    // Verify candidate exists and matches position
    const { data: candidate, error: candidateError } = await supabase
      .from('candidates')
      .select('id, position')
      .eq('id', candidateId)
      .eq('position', position)
      .single();

    if (candidateError || !candidate) {
      return NextResponse.json<ErrorResponse>({
        error: 'Invalid Candidate',
        message: 'Selected candidate is not valid for this position'
      }, { status: 400 });
    }

    // Check if user has already voted for this position
    const { data: existingVote, error: voteCheckError } = await supabase
      .from('votes')
      .select('*')
      .eq('user_id', session.id)
      .eq('position', position)
      .single();

    if (voteCheckError && voteCheckError.code !== 'PGRST116') {
      throw voteCheckError;
    }

    if (existingVote) {
      return NextResponse.json<ErrorResponse>({
        error: 'Already Voted',
        message: 'You have already voted for this position'
      }, { status: 400 });
    }

    // Insert vote record
    const { error: voteError } = await supabase
      .from('votes')
      .insert([{
        user_id: session.id,
        candidate_id: candidateId,
        position: position,
        voted_at: new Date().toISOString()
      }]);

    if (voteError) {
      throw voteError;
    }

    // Get total unique positions from candidates
    const { data: positions, error: positionsError } = await supabase
      .from('candidates')
      .select('position', { count: 'exact', head: false })
      .limit(1000);

    if (positionsError) throw positionsError;

    // Get user's votes
    const { data: userVotes, error: userVotesError } = await supabase
      .from('votes')
      .select('position')
      .eq('user_id', session.id);

    if (userVotesError) throw userVotesError;

    const uniqueVotedPositions = new Set(userVotes?.map(v => v.position));
    const hasCompletedVoting = positions && 
      uniqueVotedPositions.size === positions.length;

    // Update user's voting status if completed
    if (hasCompletedVoting) {
      const { error: updateError } = await supabase
        .from('users')
        .update({ has_voted: true })
        .eq('id', session.id);

      if (updateError) {
        console.error('Error updating user voting status:', updateError);
      }
    }

    return NextResponse.json<VoteResponse>({ 
      success: true,
      hasCompletedVoting,
      redirect: hasCompletedVoting ? '/vote/thanks' : undefined
    });

  } catch (error: any) {
    console.error('Vote error:', error);
    return NextResponse.json<ErrorResponse>({
      error: 'Server Error',
      message: process.env.NODE_ENV === 'development' 
        ? error.message 
        : 'An error occurred while processing your vote'
    }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json<ErrorResponse>({ 
        error: 'Unauthorized',
        message: 'Please login to view votes' 
      }, { status: 401 });
    }

    const { data: votes, error } = await supabase
      .from('votes')
      .select('position, candidate_id, voted_at')
      .eq('user_id', session.id)
      .order('voted_at', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ votes });

  } catch (error: any) {
    console.error('Get votes error:', error);
    return NextResponse.json<ErrorResponse>({
      error: 'Server Error',
      message: 'Failed to fetch voting history'
    }, { status: 500 });
  }
}