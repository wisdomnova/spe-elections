'use client';

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

export default function Home() {
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  };

  const stagger = {
    animate: {
      transition: { 
        staggerChildren: 0.2
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50">
      <div className="container mx-auto px-4 py-8 flex flex-col min-h-screen">
        <motion.nav 
          className="flex justify-between items-center mb-16"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <Image
              src="/spe_vert_blue.svg"
              alt="SPE Logo"
              width={120}
              height={64}
              className="w-auto h-16"
            />
          </motion.div>
          <motion.div 
            className="space-x-4"
            variants={stagger}
            initial="initial"
            animate="animate"
          >
            <motion.span
              variants={fadeInUp}
              whileHover={{ scale: 1.05 }}
            >
              <Link
                href="/login"
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Student Login
              </Link>
            </motion.span>
            <motion.span
              variants={fadeInUp}
              whileHover={{ scale: 1.05 }}
            >
              <Link
                href="/admin/login"
                className="text-gray-600 hover:text-gray-800 font-medium"
              >
                Admin Portal
              </Link>
            </motion.span>
          </motion.div>
        </motion.nav>

        <motion.main 
          className="flex-1 flex items-center justify-center"
          variants={stagger}
          initial="initial"
          animate="animate"
        >
          <div className="max-w-3xl w-full text-center space-y-8">
            <motion.h1 
              className="text-5xl font-bold text-gray-900 tracking-tight"
              variants={fadeInUp}
            >
              SPE UNIBEN Elections Portal
            </motion.h1>
            <motion.p 
              className="text-xl text-gray-600 max-w-2xl mx-auto"
              variants={fadeInUp}
            >
              Welcome to the Society of Petroleum Engineers UNIBEN Student Chapter voting platform.
            </motion.p>
            <motion.div 
              className="flex gap-6 justify-center mt-12"
              variants={fadeInUp}
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  href="/login"
                  className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
                >
                  Login to Vote
                </Link>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  href="/about"
                  className="px-8 py-4 bg-white text-blue-600 rounded-lg border-2 border-blue-600 hover:bg-blue-50 transition-colors"
                >
                  Learn More
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </motion.main>

        <motion.footer 
          className="py-8 text-center text-gray-600"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
        >
          <p>© {new Date().getFullYear()} SPE UNIBEN Student Chapter. All rights reserved.</p>
        </motion.footer>
      </div>
    </div>
  );
}