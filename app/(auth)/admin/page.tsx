// app/(auth)/admin/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import type { Candidate } from '@/app/types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AdminDashboard() {
  const [results, setResults] = useState<Record<string, Candidate[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [totalVoters, setTotalVoters] = useState(0);

  useEffect(() => {
    fetchResults();
    fetchVoterStats();
  }, []);

  const fetchResults = async () => {
    try {
      const { data, error } = await supabase
        .from('candidates')
        .select('*')
        .order('position', { ascending: true })
        .order('vote_count', { ascending: false });

      if (error) throw error;

      const grouped = (data || []).reduce((acc, candidate) => {
        if (!acc[candidate.position]) {
          acc[candidate.position] = [];
        }
        acc[candidate.position].push(candidate);
        return acc;
      }, {} as Record<string, Candidate[]>);

      setResults(grouped);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchVoterStats = async () => {
    try {
      const { count } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('has_voted', true);
      
      setTotalVoters(count || 0);
    } catch (err: any) {
      console.error('Error fetching voter stats:', err);
    }
  };

  const getChartData = (position: string, candidates: Candidate[]) => ({
    labels: candidates.map(c => c.full_name),
    datasets: [
      {
        label: 'Votes',
        data: candidates.map(c => c.vote_count),
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
      },
    ],
  });

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
  
  if (error) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Election Results</h1>
        <div className="bg-blue-100 px-4 py-2 rounded">
          <span className="font-semibold">Total Votes Cast:</span> {totalVoters}
        </div>
      </div>

      {Object.entries(results).map(([position, candidates]) => (
        <div key={position} className="mb-12 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-6">{position}</h2>
          
          <div className="mb-8 bg-white p-4 rounded-lg">
            <Bar data={getChartData(position, candidates)} options={chartOptions} />
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Candidate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Votes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Percentage
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {candidates.map((candidate) => {
                  const totalVotes = candidates.reduce(
                    (sum, c) => sum + c.vote_count,
                    0
                  );
                  const percentage = totalVotes
                    ? ((candidate.vote_count / totalVotes) * 100).toFixed(1)
                    : '0';

                  return (
                    <tr key={candidate.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {candidate.image_url && (
                            <img
                              src={candidate.image_url}
                              alt=""
                              className="h-10 w-10 rounded-full mr-3 object-cover"
                            />
                          )}
                          <div className="text-sm font-medium text-gray-900">
                            {candidate.full_name}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">
                          {candidate.vote_count}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">
                          {percentage}%
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}