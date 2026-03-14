import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { toast } from 'react-toastify'
import { companyLogin } from '../../services/api'
import Navbar from '../../components/Navbar'

export default function CompanyLogin() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ email: '', password: '' })

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async () => {
    if (!form.email || !form.password) {
      toast.error('Please fill all fields')
      return
    }
    setLoading(true)
    try {
      const res = await companyLogin({
        username: form.email,
        password: form.password,
        entity_type: 'admin'
      })
      const token = res.data.data.access_token
      localStorage.setItem('company_token', token)
      toast.success('Welcome back!')
      navigate('/company/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSubmit()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex flex-col">
      <Navbar />
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-28 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <h1
              className="text-3xl font-bold text-purple-900 mb-2"
              style={{ fontFamily: 'Playfair Display, serif' }}
            >
              Company Login
            </h1>
            <p className="text-gray-400 text-sm">
              Sign in to manage your team and settings
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur border border-purple-100 rounded-3xl p-8 shadow-xl space-y-5">
            <div className="h-1.5 w-full rounded-full bg-gradient-to-r from-purple-400 to-indigo-400 mb-6" />

            <div>
              <label className="text-sm font-medium text-gray-600 mb-1 block">
                Email Address
              </label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="you@company.com"
                className="w-full px-4 py-3 rounded-xl border border-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-300 text-sm bg-purple-50/30"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600 mb-1 block">
                Password
              </label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="Your password"
                className="w-full px-4 py-3 rounded-xl border border-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-300 text-sm bg-purple-50/30"
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-500 text-white font-semibold hover:opacity-90 hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            <p className="text-center text-sm text-gray-400">
              New company?{' '}
              <span
                onClick={() => navigate('/company/register')}
                className="text-purple-600 cursor-pointer hover:underline font-medium"
              >
                Register here
              </span>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}