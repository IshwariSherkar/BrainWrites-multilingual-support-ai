import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import logo from '../assets/logo.svg'

export default function Navbar({ showAuth = true }) {
  const navigate = useNavigate()

  return (
    <motion.div
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/60 border-b border-purple-100"
    >
      <div className="max-w-6xl mx-auto px-6 py-3 flex justify-between items-center">

        {/* Logo + Name */}
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => navigate('/')}
        >
          <img src={logo} alt="BrainWrites" className="h-8 w-auto mix-blend-multiply" />
          <div>
            <p className="text-sm font-bold text-purple-900 leading-none">
              BrainWrites
            </p>
            <p className="text-xs text-purple-400 leading-none mt-0.5">
              One voice, infinite languages
            </p>
          </div>
        </div>

        {/* Nav Links */}
        {showAuth && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/demo')}
              className="px-4 py-2 rounded-lg text-purple-700 hover:bg-purple-50 text-sm font-medium transition"
            >
              Try Demo
            </button>
            <button
              onClick={() => navigate('/pricing')}
              className="px-4 py-2 rounded-lg text-purple-700 hover:bg-purple-50 text-sm font-medium transition"
            >
              Pricing
            </button>
            <button
              onClick={() => navigate('/portal')}
              className="px-4 py-2 rounded-lg border border-purple-200 text-purple-700 hover:bg-purple-50 text-sm font-medium transition"
            >
              Sign In
            </button>
          </div>
        )}

      </div>
    </motion.div>
  )
}