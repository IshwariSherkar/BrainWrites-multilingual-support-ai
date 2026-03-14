import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { SignIn } from '@clerk/clerk-react'
import Navbar from '../../components/Navbar'

export default function RepLogin() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col">

      {/* Navbar */}
      <Navbar />

      {/* Main */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-24 pb-16">

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <h1
            className="text-3xl font-bold text-indigo-900 mb-2"
            style={{ fontFamily: 'Playfair Display, serif' }}
          >
            Representative Login
          </h1>
          <p className="text-gray-400 text-sm">
            Sign in to handle customer conversations
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <SignIn
            routing="hash"
            fallbackRedirectUrl="/representative/register"
            appearance={{
              elements: {
                rootBox: "shadow-none",
                card: "shadow-lg border border-indigo-100 rounded-2xl",
                headerTitle: "text-indigo-900",
                formButtonPrimary: "bg-indigo-600 hover:bg-indigo-700",
                footerActionLink: "text-indigo-600 hover:text-indigo-700"
              }
            }}
          />
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 text-sm text-gray-400"
        >
          New representative?{' '}
          <span
            onClick={() => navigate('/representative/register')}
            className="text-indigo-600 cursor-pointer hover:underline font-medium"
          >
            Register here
          </span>
        </motion.p>

      </div>

    </div>
  )
}