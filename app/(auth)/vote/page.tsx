'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';
import toast, { Toaster } from 'react-hot-toast';
import type { Candidate } from '@/app/types';

// Initialize Supabase client for read-only operations
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
  const [votedPositions, setVotedPositions] = useState<Set<string>>(new Set());
  const router = useRouter();

  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      try {
        const response = await fetch('/api/auth/check');
        if (!response.ok) {
          router.push('/login');
          return;
        }
        await Promise.all([fetchCandidates(), fetchVotedPositions()]);
      } catch (err) {
        console.error('Auth check failed:', err);
        router.push('/login');
      }
    };

    checkAuthAndFetchData();
  }, [router]);

  const fetchVotedPositions = async () => {
    try {
      const response = await fetch('/api/votes', {
        headers: { 'Cache-Control': 'no-cache' }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login');
          return;
        }
        throw new Error('Failed to fetch voted positions');
      }
      
      const data = await response.json();
      if (data.votes) {
        setVotedPositions(new Set(data.votes.map((v: any) => v.position.toLowerCase().trim())));
      }
    } catch (err: any) {
      toast.error('Failed to fetch your voting history');
      console.error('Error fetching voted positions:', err);
    }
  };

  const fetchCandidates = async () => {
    try {
      const { data, error } = await supabase
        .from('candidates')
        .select('*')
        .order('position');

      if (error) throw error;
      
      if (!data || data.length === 0) {
        setError('No candidates found');
        return;
      }
      
      // Group candidates by normalized position
      const positionGroups = data.reduce((acc, candidate) => {
        const normalizedPosition = candidate.position.toLowerCase().trim();
        if (!acc[normalizedPosition]) {
          acc[normalizedPosition] = [];
        }
        acc[normalizedPosition].push({
          ...candidate,
          position: normalizedPosition
        });
        return acc;
      }, {} as Record<string, Candidate[]>);

      // Sort positions and flatten array
      const sortedData = Object.keys(positionGroups)
        .sort()
        .flatMap(pos => positionGroups[pos]);
      
      setCandidates(sortedData);
    } catch (err: any) {
      setError('Failed to load candidates');
      toast.error('Failed to load candidates');
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (candidateId: string) => {
    try {
      setVoting(true);
      setError('');
      const position = uniquePositions[currentPosition];

      if (votedPositions.has(position)) {
        throw new Error('You have already voted for this position');
      }

      const response = await fetch('/api/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          candidateId,
          position,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit vote');
      }

      // Update voted positions
      setVotedPositions(prev => new Set([...prev, position]));

      // Show success message
      const candidate = candidates.find(c => c.id === candidateId);
      toast.success(`Vote submitted for ${candidate?.full_name}`);

      // Move to next position if available
      if (currentPosition < uniquePositions.length - 1) {
        setCurrentPosition(currentPosition + 1);
      } else {
        // All positions voted
        router.push('/vote/thanks');
      }

    } catch (err: any) {
      setError(err.message);
      toast.error(err.message || 'Failed to submit vote');
    } finally {
      setVoting(false);
    }
  };

  const uniquePositions = Array.from(new Set(candidates.map(c => c.position)));
  const currentCandidates = candidates.filter(c => c.position === uniquePositions[currentPosition]);
  const progress = ((currentPosition + 1) / uniquePositions.length) * 100;
  const totalVoted = votedPositions.size;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading candidates...</p>
        </div>
      </div>
    );
  }

  if (error && !candidates.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full">
          <div className="text-red-600 text-center mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-center">{error}</h3>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white py-8">
      <div className="max-w-4xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-6 mb-8"
        >
          <div className="mb-6">
            <div className="h-2 bg-gray-100 rounded-full">
              <motion.div
                className="h-full bg-blue-600 rounded-full"
                style={{ width: `${progress}%` }}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <div className="mt-2 text-center text-sm text-gray-600">
              Position {currentPosition + 1} of {uniquePositions.length} • 
              {Math.round(progress)}% complete • {totalVoted} votes cast
            </div>
          </div>

          <div className="max-w-2xl mx-auto">
            <motion.h2
              key={currentPosition}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-2xl font-bold mb-6 text-center text-gray-900 capitalize"
            >
              {uniquePositions[currentPosition]}
            </motion.h2>

            <div className="space-y-4">
              {currentCandidates.map((candidate) => (
                <motion.button
                  key={candidate.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleVote(candidate.id)}
                  disabled={voting || votedPositions.has(uniquePositions[currentPosition])}
                  className={`w-full p-6 border ${
                    votedPositions.has(uniquePositions[currentPosition])
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-blue-500'
                  } rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-white text-left`}
                >
                  <div className="flex items-center gap-4">
                    {candidate.image_url && (
                      <div className="relative h-24 w-24 flex-shrink-0 rounded-lg overflow-hidden">
                        <Image
                          src={candidate.image_url}
                          alt={candidate.full_name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{candidate.full_name}</h3>
                      <p className="text-gray-600 mt-2 text-sm">{candidate.bio}</p>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>

            <div className="mt-8 flex justify-between">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCurrentPosition(Math.max(0, currentPosition - 1))}
                disabled={currentPosition === 0 || voting}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
              >
                Previous
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCurrentPosition(Math.min(uniquePositions.length - 1, currentPosition + 1))}
                disabled={currentPosition === uniquePositions.length - 1 || voting}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                Next
              </motion.button>
            </div>
          </div>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg mt-4 max-w-2xl mx-auto"
          >
            {error}
          </motion.div>
        )}
      </div>

      {voting && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
        >
          <div className="bg-white p-6 rounded-xl shadow-lg max-w-sm w-full mx-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-center text-gray-700">Submitting your vote...</p>
          </div>
        </motion.div>
      )}

      {/* Toast Container */}
      <div className="fixed bottom-4 inset-x-0 flex justify-center">
        <Toaster
          position="bottom-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#363636',
              color: '#fff',
              marginBottom: '1rem'
            },
          }}
        />
      </div>
    </div>
  );
}