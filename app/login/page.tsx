// app/login/page.tsx
// app/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import ReCAPTCHA from 'react-google-recaptcha';
import Image from 'next/image';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [speNumber, setSpeNumber] = useState('');
  const [recaptchaToken, setRecaptchaToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recaptchaToken) {
      setError('Please complete the reCAPTCHA');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, spe_number: speNumber, recaptchaToken }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      router.push('/vote');
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex flex-col">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute top-4 left-4"
      >
        <Link href="/" className="text-gray-600 hover:text-gray-900">
          ← Back to home
        </Link>
      </motion.div>

      <div className="container mx-auto px-4 py-8 flex-1 flex items-center justify-center">
        <motion.div 
          className="max-w-md w-full"
          initial="initial"
          animate="animate"
          variants={{
            initial: { opacity: 0, y: 50 },
            animate: { opacity: 1, y: 0 }
          }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center mb-8">
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <Image
                src="/spe_vert_blue.svg"
                alt="SPE Logo"
                width={100}
                height={53}
                className="mx-auto mb-6"
              />
            </motion.div>
            <motion.h2 
              className="text-3xl font-bold text-gray-900"
              variants={fadeInUp}
            >
              Student Login
            </motion.h2>
            <motion.p 
              className="mt-2 text-gray-600"
              variants={fadeInUp}
            >
              Enter your credentials to vote
            </motion.p>
          </div>

          <motion.div
            className="bg-white p-8 rounded-xl shadow-lg border border-gray-100"
            variants={fadeInUp}
          >
            {error && (
              <motion.div 
                className="bg-red-50 text-red-600 p-4 rounded-lg text-sm mb-6"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <motion.div variants={fadeInUp}>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-shadow text-gray-900 placeholder-gray-400"
                  required
                  placeholder="Enter your email"
                />
              </motion.div>

              <motion.div variants={fadeInUp}>
                <label htmlFor="speNumber" className="block text-sm font-medium text-gray-700 mb-2">
                  SPE Number
                </label>
                <input
                  id="speNumber"
                  type="text"
                  value={speNumber}
                  onChange={(e) => setSpeNumber(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-shadow text-gray-900 placeholder-gray-400"
                  required
                  placeholder="Enter your SPE number"
                />
              </motion.div>

              <motion.div 
                className="flex justify-center"
                variants={fadeInUp}
              >
                <ReCAPTCHA
                  sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!}
                  onChange={(token) => setRecaptchaToken(token || '')}
                />
              </motion.div>

              <motion.button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                variants={fadeInUp}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </motion.button>
            </form>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}