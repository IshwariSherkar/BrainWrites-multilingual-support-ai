import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { toast } from 'react-toastify'
import { registerRepresentative } from '../../services/api'
import Navbar from '../../components/Navbar'

const languages = ['english', 'hindi', 'marathi', 'gujarati', 'punjabi']

export default function RepRegister() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    companyId: '',
    language: 'english'
  })

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.password || !form.companyId) {
      toast.error('Please fill all required fields')
      return
    }
    setLoading(true)
    try {
      await registerRepresentative(form)
      toast.success('Registered successfully!')
      navigate('/representative/login')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col">

      {/* Navbar */}
      <Navbar />

      {/* Form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-28 pb-16">

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-lg"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <h1
              className="text-3xl font-bold text-indigo-900 mb-2"
              style={{ fontFamily: 'Playfair Display, serif' }}
            >
              Join as Representative
            </h1>
            <p className="text-gray-400 text-sm">
              Enter your company ID to get started
            </p>
          </div>

          {/* Card */}
          <div className="bg-white/80 backdrop-blur border border-indigo-100 rounded-3xl p-8 shadow-xl space-y-5">

            {/* Gradient top bar */}
            <div className="h-1.5 w-full rounded-full bg-gradient-to-r from-indigo-400 to-purple-400 mb-6" />

            {/* Full Name */}
            <div>
              <label className="text-sm font-medium text-gray-600 mb-1 block">
                Full Name <span className="text-red-400">*</span>
              </label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Your full name"
                className="w-full px-4 py-3 rounded-xl border border-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-300 text-sm bg-indigo-50/30"
              />
            </div>

            {/* Email */}
            <div>
              <label className="text-sm font-medium text-gray-600 mb-1 block">
                Email Address <span className="text-red-400">*</span>
              </label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@company.com"
                className="w-full px-4 py-3 rounded-xl border border-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-300 text-sm bg-indigo-50/30"
              />
            </div>

            {/* Password */}
            <div>
              <label className="text-sm font-medium text-gray-600 mb-1 block">
                Password <span className="text-red-400">*</span>
              </label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Minimum 6 characters"
                className="w-full px-4 py-3 rounded-xl border border-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-300 text-sm bg-indigo-50/30"
              />
            </div>

            {/* Company ID */}
            <div>
              <label className="text-sm font-medium text-gray-600 mb-1 block">
                Company ID <span className="text-red-400">*</span>
              </label>
              <input
                name="companyId"
                value={form.companyId}
                onChange={handleChange}
                placeholder="Get this from your manager"
                className="w-full px-4 py-3 rounded-xl border border-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-300 text-sm bg-indigo-50/30"
              />
              <p className="text-xs text-gray-400 mt-1">
                Ask your manager for the Company ID from their dashboard
              </p>
            </div>

            {/* Language */}
            <div>
              <label className="text-sm font-medium text-gray-600 mb-1 block">
                Your Language
              </label>
              <div className="grid grid-cols-3 gap-2">
                {languages.map(lang => (
                  <button
                    key={lang}
                    onClick={() => setForm({ ...form, language: lang })}
                    className={`py-2 px-3 rounded-xl text-sm font-medium border transition capitalize ${
                      form.language === lang
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-transparent'
                        : 'border-indigo-100 text-gray-500 hover:border-indigo-300'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-500 text-white font-semibold hover:opacity-90 hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? 'Registering...' : 'Register'}
            </button>

            <p className="text-center text-sm text-gray-400">
              Already registered?{' '}
              <span
                onClick={() => navigate('/representative/login')}
                className="text-indigo-600 cursor-pointer hover:underline font-medium"
              >
                Sign in
              </span>
            </p>

          </div>
        </motion.div>
      </div>

    </div>
  )
}