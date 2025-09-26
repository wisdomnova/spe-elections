// app/api/vote/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        message: 'Please login to vote' 
      }, { status: 401 });
    }

    const { candidateId, position } = await request.json();
    if (!candidateId) {
      return NextResponse.json({ 
        error: 'Bad Request',
        message: 'Candidate ID is required' 
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
      return NextResponse.json({
        error: 'Already Voted',
        message: 'You have already voted for this position'
      }, { status: 400 });
    }

    // Start a Postgres transaction
    const { error: transactionError } = await supabase.rpc('create_vote', {
      p_user_id: session.id,
      p_candidate_id: candidateId,
      p_position: position
    });

    if (transactionError) {
      throw transactionError;
    }

    // Check if user has completed all votes
    const { data: positions } = await supabase
      .from('candidates')
      .select('position', { count: 'exact', head: false })
      .limit(1000);
     
    const { data: userVotes } = await supabase
      .from('votes')
      .select('position')
      .eq('user_id', session.id);

    const hasCompletedVoting = positions && userVotes && 
      positions.length === userVotes.length;

    return NextResponse.json({ 
      success: true,
      hasCompletedVoting,
      redirect: hasCompletedVoting ? '/vote/thanks' : undefined
    });

  } catch (error: any) {
    console.error('Vote error:', error);
    return NextResponse.json({
      error: 'Server Error',
      message: process.env.NODE_ENV === 'development' 
        ? error.message 
        : 'An error occurred while processing your vote'
    }, { status: 500 });
  }
}