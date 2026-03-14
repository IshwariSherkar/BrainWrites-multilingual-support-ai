import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { toast } from 'react-toastify'
import { registerCompany } from '../../services/api'
import Navbar from '../../components/Navbar'

const industries = ['ecommerce', 'banking', 'telecom', 'healthcare', 'retail', 'other']
const tones = ['professional', 'empathetic', 'formal', 'friendly']
const languages = ['english', 'hindi', 'marathi', 'gujarati', 'punjabi']

export default function ManagerRegister() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    company_name: '',
    industry: 'ecommerce',
    default_tone: 'professional',
    output_language: 'english'
  })

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.password || !form.company_name) {
      toast.error('Please fill all required fields')
      return
    }
    setLoading(true)
    try {
      await registerCompany(form)
      toast.success('Company registered successfully!')
      navigate('/manager/login')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex flex-col">

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
              className="text-3xl font-bold text-purple-900 mb-2"
              style={{ fontFamily: 'Playfair Display, serif' }}
            >
              Register Your Company
            </h1>
            <p className="text-gray-400 text-sm">
              Set up your multilingual customer support in minutes
            </p>
          </div>

          {/* Card */}
          <div className="bg-white/80 backdrop-blur border border-purple-100 rounded-3xl p-8 shadow-xl space-y-5">

            {/* Gradient top bar */}
            <div className="h-1.5 w-full rounded-full bg-gradient-to-r from-purple-400 to-indigo-400 mb-6" />

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
                className="w-full px-4 py-3 rounded-xl border border-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-300 text-sm bg-purple-50/30"
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
                className="w-full px-4 py-3 rounded-xl border border-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-300 text-sm bg-purple-50/30"
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
                className="w-full px-4 py-3 rounded-xl border border-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-300 text-sm bg-purple-50/30"
              />
            </div>

            {/* Company Name */}
            <div>
              <label className="text-sm font-medium text-gray-600 mb-1 block">
                Company Name <span className="text-red-400">*</span>
              </label>
              <input
                name="company_name"
                value={form.company_name}
                onChange={handleChange}
                placeholder="e.g. Zomato, Flipkart, HDFC"
                className="w-full px-4 py-3 rounded-xl border border-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-300 text-sm bg-purple-50/30"
              />
            </div>

            {/* Industry */}
            <div>
              <label className="text-sm font-medium text-gray-600 mb-1 block">
                Industry
              </label>
              <select
                name="industry"
                value={form.industry}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-300 text-sm bg-purple-50/30 capitalize"
              >
                {industries.map(ind => (
                  <option key={ind} value={ind} className="capitalize">
                    {ind.charAt(0).toUpperCase() + ind.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Default Tone */}
            <div>
              <label className="text-sm font-medium text-gray-600 mb-1 block">
                Default Tone
              </label>
              <div className="grid grid-cols-2 gap-2">
                {tones.map(tone => (
                  <button
                    key={tone}
                    onClick={() => setForm({ ...form, default_tone: tone })}
                    className={`py-2 px-4 rounded-xl text-sm font-medium border transition capitalize ${
                      form.default_tone === tone
                        ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white border-transparent'
                        : 'border-purple-100 text-gray-500 hover:border-purple-300'
                    }`}
                  >
                    {tone}
                  </button>
                ))}
              </div>
            </div>

            {/* Output Language */}
            <div>
              <label className="text-sm font-medium text-gray-600 mb-1 block">
                Output Language
              </label>
              <div className="grid grid-cols-3 gap-2">
                {languages.map(lang => (
                  <button
                    key={lang}
                    onClick={() => setForm({ ...form, output_language: lang })}
                    className={`py-2 px-3 rounded-xl text-sm font-medium border transition capitalize ${
                      form.output_language === lang
                        ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white border-transparent'
                        : 'border-purple-100 text-gray-500 hover:border-purple-300'
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
              className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-500 text-white font-semibold hover:opacity-90 hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? 'Registering...' : 'Register Company'}
            </button>

            <p className="text-center text-sm text-gray-400">
              Already registered?{' '}
              <span
                onClick={() => navigate('/manager/login')}
                className="text-purple-600 cursor-pointer hover:underline font-medium"
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