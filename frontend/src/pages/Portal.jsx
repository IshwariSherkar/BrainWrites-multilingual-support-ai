import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { ShieldCheck, UserRound, Building2 } from 'lucide-react'
import Navbar from '../components/Navbar'

export default function Portal() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex flex-col">
      <Navbar />

      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-24 pb-16">

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-4xl font-bold text-purple-900 mb-3 text-center"
          style={{ fontFamily: 'Playfair Display, serif' }}
        >
          Who are you?
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-gray-400 mb-12 text-center"
        >
          Choose your portal to continue
        </motion.p>

        <div className="flex flex-col sm:flex-row gap-6 w-full max-w-3xl">

          {/* Company Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            onClick={() => navigate('/company/login')}
            className="flex-1 bg-white border border-green-100 rounded-2xl p-8 flex flex-col items-center gap-4 cursor-pointer hover:shadow-xl hover:border-green-300 transition-all duration-300 group"
          >
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition">
              <Building2 className="text-green-700 w-8 h-8" />
            </div>
            <div className="text-center">
              <h2 className="text-xl font-bold text-green-800 mb-1">Company</h2>
              <p className="text-gray-400 text-xs">
                Register your company and manage managers
              </p>
            </div>
            <button className="w-full py-2.5 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 transition text-sm">
              Company Login
            </button>
          </motion.div>

          {/* Manager Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            onClick={() => navigate('/manager/login')}
            className="flex-1 bg-white border border-purple-100 rounded-2xl p-8 flex flex-col items-center gap-4 cursor-pointer hover:shadow-xl hover:border-purple-300 transition-all duration-300 group"
          >
            <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition">
              <ShieldCheck className="text-purple-700 w-8 h-8" />
            </div>
            <div className="text-center">
              <h2 className="text-xl font-bold text-purple-800 mb-1">Manager</h2>
              <p className="text-gray-400 text-xs">
                Manage conversations, team and analytics
              </p>
            </div>
            <button className="w-full py-2.5 rounded-xl bg-purple-600 text-white font-semibold hover:bg-purple-700 transition text-sm">
              Manager Login
            </button>
          </motion.div>

          {/* Representative Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            onClick={() => navigate('/representative/login')}
            className="flex-1 bg-white border border-indigo-100 rounded-2xl p-8 flex flex-col items-center gap-4 cursor-pointer hover:shadow-xl hover:border-indigo-300 transition-all duration-300 group"
          >
            <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center group-hover:bg-indigo-200 transition">
              <UserRound className="text-indigo-600 w-8 h-8" />
            </div>
            <div className="text-center">
              <h2 className="text-xl font-bold text-indigo-800 mb-1">Representative</h2>
              <p className="text-gray-400 text-xs">
                Handle customer conversations
              </p>
            </div>
            <button className="w-full py-2.5 rounded-xl bg-indigo-500 text-white font-semibold hover:bg-indigo-600 transition text-sm">
              Representative Login
            </button>
          </motion.div>

        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-10 text-sm text-gray-400"
        >
          New company?{' '}
          <span
            onClick={() => navigate('/company/register')}
            className="text-purple-600 cursor-pointer hover:underline font-medium"
          >
            Register here
          </span>
        </motion.p>

      </div>

      <footer className="py-6 text-center text-xs text-gray-300">
        &copy; {new Date().getFullYear()} BrainWrites. All rights reserved.
      </footer>
    </div>
  )
}