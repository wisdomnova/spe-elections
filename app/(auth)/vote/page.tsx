'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';
import toast from 'react-hot-toast';
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
    fetchCandidates();
    fetchVotedPositions();
  }, []);

  const fetchVotedPositions = async () => {
    try {
      const response = await fetch('/api/votes');
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error);
      
      if (data.votes) {
        setVotedPositions(new Set(data.votes.map((v: any) => v.position)));
      }
    } catch (err: any) {
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
      setCandidates(data || []);
    } catch (err: any) {
      setError(err.message);
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

  // ...existing loading and error JSX...

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white py-8">
      <div className="max-w-4xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-6 mb-8"
        >
          {/* ...existing progress bar JSX... */}

          <motion.h2
            key={currentPosition}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-2xl font-bold mb-6 text-center text-gray-900"
          >
            {uniquePositions[currentPosition]}
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {currentCandidates.map((candidate) => (
              <motion.button
                key={candidate.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleVote(candidate.id)}
                disabled={voting || votedPositions.has(uniquePositions[currentPosition])}
                className={`p-6 border ${
                  votedPositions.has(uniquePositions[currentPosition])
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-blue-500'
                } rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-white text-left`}
              >
                {candidate.image_url && (
                  <div className="relative h-48 w-full mb-4 rounded-lg overflow-hidden">
                    <Image
                      src={candidate.image_url}
                      alt={candidate.full_name}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <h3 className="text-xl font-semibold text-gray-900">{candidate.full_name}</h3>
                <p className="text-gray-600 mt-2 text-sm">{candidate.bio}</p>
              </motion.button>
            ))}
          </div>

          {/* ...existing navigation buttons... */}
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg mt-4"
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
    </div>
  );
}