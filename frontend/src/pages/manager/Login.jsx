import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { SignIn } from '@clerk/clerk-react'
import Navbar from '../../components/Navbar'

export default function ManagerLogin() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex flex-col">

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
            className="text-3xl font-bold text-purple-900 mb-2"
            style={{ fontFamily: 'Playfair Display, serif' }}
          >
            Manager Login
          </h1>
          <p className="text-gray-400 text-sm">
            Sign in to manage your company's customer support
          </p>
        </motion.div>

        {/* Clerk Sign In */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <SignIn
            routing="hash"
            fallbackRedirectUrl="/manager/dashboard"
            appearance={{
              elements: {
                rootBox: "shadow-none",
                card: "shadow-lg border border-purple-100 rounded-2xl",
                headerTitle: "text-purple-900",
                formButtonPrimary: "bg-purple-600 hover:bg-purple-700",
                footerActionLink: "text-purple-600 hover:text-purple-700"
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
          New company?{' '}
          <span
            onClick={() => navigate('/manager/register')}
            className="text-purple-600 cursor-pointer hover:underline font-medium"
          >
            Register here
          </span>
        </motion.p>

      </div>

    </div>
  )
}