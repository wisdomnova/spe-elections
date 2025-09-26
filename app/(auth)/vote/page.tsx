// app/(auth)/vote/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import type { Candidate } from '@/app/types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function VotePage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    try {
      const { data, error } = await supabase
        .from('candidates')
        .select('*')
        .order('position');
      
      if (error) throw error;
      setCandidates(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const uniquePositions = Array.from(new Set(candidates.map(c => c.position)));
  const currentCandidates = candidates.filter(c => c.position === uniquePositions[currentPosition]);
  const progress = ((currentPosition + 1) / uniquePositions.length) * 100;

  const handleVote = async (candidateId: string) => {
    try {
      setVoting(true);
      setError('');

      const response = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          candidateId,
          position: uniquePositions[currentPosition]
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit vote');
      }

      if (data.hasCompletedVoting) {
        router.push('/vote/thanks');
      } else if (currentPosition < uniquePositions.length - 1) {
        setCurrentPosition(currentPosition + 1);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setVoting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="mb-8">
        <div className="h-2 bg-gray-200 rounded-full">
          <div 
            className="h-full bg-blue-600 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-2 text-center text-sm text-gray-600">
          Position {currentPosition + 1} of {uniquePositions.length}
        </div>
      </div>

      <h2 className="text-2xl font-bold mb-6 text-center">
        {uniquePositions[currentPosition]}
      </h2>

      {voting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-4 rounded-lg shadow-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-center">Submitting your vote...</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {currentCandidates.map((candidate) => (
          <button
            key={candidate.id}
            onClick={() => handleVote(candidate.id)}
            disabled={voting}
            className="p-4 border rounded-lg hover:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {candidate.image_url && (
              <img
                src={candidate.image_url}
                alt={candidate.full_name}
                className="w-full h-48 object-cover rounded-lg mb-4"
              />
            )}
            <h3 className="text-xl font-semibold">{candidate.full_name}</h3>
            <p className="text-gray-600 mt-2">{candidate.bio}</p>
          </button>
        ))}
      </div>

      <div className="mt-8 flex justify-between">
        <button
          onClick={() => setCurrentPosition(Math.max(0, currentPosition - 1))}
          disabled={currentPosition === 0 || voting}
          className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
        >
          Previous
        </button>
        <button
          onClick={() => setCurrentPosition(Math.min(uniquePositions.length - 1, currentPosition + 1))}
          disabled={currentPosition === uniquePositions.length - 1 || voting}
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}