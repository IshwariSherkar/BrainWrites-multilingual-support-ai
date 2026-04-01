import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { toast } from 'react-toastify'
import { registerCompany } from '../../services/api'
import Navbar from '../../components/Navbar'
import { Check, X, Eye, EyeOff } from 'lucide-react'

const industries = ['ecommerce', 'banking', 'telecom', 'healthcare', 'retail', 'other']

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: '₹0',
    period: 'forever',
    color: 'border-gray-200',
    activeColor: 'border-purple-400 bg-purple-50/50',
    features: ['50 conversations/month', '1 language', 'Basic quality scoring', '1 representative'],
    notIncluded: ['Email digest', 'Analytics', 'Custom tone']
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '₹999',
    period: 'per month',
    badge: 'Most Popular',
    color: 'border-purple-200',
    activeColor: 'border-purple-600 bg-purple-50/50',
    features: ['500 conversations/month', 'All 4 languages', 'Advanced quality scoring', 'Up to 5 representatives', 'Daily email digest', 'Analytics dashboard'],
    notIncluded: ['Custom tone']
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Custom',
    period: 'contact us',
    color: 'border-indigo-200',
    activeColor: 'border-indigo-500 bg-indigo-50/50',
    features: ['Unlimited conversations', 'All 4 languages', 'Advanced quality scoring', 'Unlimited representatives', 'Daily email digest', 'Analytics dashboard', 'Custom tone training', 'Priority support'],
    notIncluded: []
  }
]

const passwordRules = [
  { label: 'At least 12 characters', test: (p) => p.length >= 12 },
  { label: 'One uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter', test: (p) => /[a-z]/.test(p) },
  { label: 'One number', test: (p) => /[0-9]/.test(p) },
  { label: 'One special character', test: (p) => /[^A-Za-z0-9]/.test(p) },
]

export default function CompanyRegister() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [confirmPassword, setConfirmPassword] = useState('')
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    company_name: '',
    industry: 'ecommerce',
    plan: 'free'
  })

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const [showPayment, setShowPayment] = useState(false)
  const allRulesPassed = passwordRules.every(r => r.test(form.password))
  const passwordsMatch = form.password === confirmPassword && confirmPassword !== ''

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.password || !form.company_name) {
      toast.error('Please fill all required fields')
      return
    }
    if (!allRulesPassed) {
      toast.error('Password does not meet requirements')
      return
    }
    if (!passwordsMatch) {
      toast.error('Passwords do not match')
      return
    }
    setLoading(true)
    try {
      await registerCompany(form)
      toast.success('Company registered! Please sign in.')
      navigate('/company/login')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex flex-col">
      <Navbar />
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-28 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-lg"
        >
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

          {/* Login note */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-3 mb-6 flex items-start gap-3">
            <span className="text-amber-500 text-lg mt-0.5">💡</span>
            <p className="text-amber-700 text-sm">
              <span className="font-semibold">Remember:</span> Use this same email and password to login as Company later.
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur border border-purple-100 rounded-3xl p-8 shadow-xl space-y-5">
            <div className="h-1.5 w-full rounded-full bg-gradient-to-r from-purple-400 to-indigo-400 mb-6" />

            {/* Full Name */}
            <div>
              <label className="text-sm font-medium text-gray-600 mb-1 block">
                Your Full Name <span className="text-red-400">*</span>
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
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Min 12 characters"
                  className="w-full px-4 py-3 pr-10 rounded-xl border border-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-300 text-sm bg-purple-50/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password rules */}
              {form.password.length > 0 && (
                <div className="mt-2 space-y-1">
                  {passwordRules.map((rule, i) => {
                    const passed = rule.test(form.password)
                    return (
                      <div key={i} className="flex items-center gap-2">
                        {passed
                          ? <Check className="w-3.5 h-3.5 text-green-500" />
                          : <X className="w-3.5 h-3.5 text-red-400" />
                        }
                        <span className={`text-xs ${passed ? 'text-green-600' : 'text-red-400'}`}>
                          {rule.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="text-sm font-medium text-gray-600 mb-1 block">
                Confirm Password <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  className={`w-full px-4 py-3 pr-10 rounded-xl border focus:outline-none focus:ring-2 text-sm bg-purple-50/30 ${
                    confirmPassword.length > 0
                      ? passwordsMatch
                        ? 'border-green-300 focus:ring-green-200'
                        : 'border-red-300 focus:ring-red-200'
                      : 'border-purple-100 focus:ring-purple-300'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-600"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmPassword.length > 0 && (
                <p className={`text-xs mt-1 ${passwordsMatch ? 'text-green-600' : 'text-red-400'}`}>
                  {passwordsMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
                </p>
              )}
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
              <label className="text-sm font-medium text-gray-600 mb-1 block">Industry</label>
              <select
                name="industry"
                value={form.industry}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-300 text-sm bg-purple-50/30"
              >
                {industries.map(ind => (
                  <option key={ind} value={ind}>
                    {ind.charAt(0).toUpperCase() + ind.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Plan Selection */}
            <div>
              <label className="text-sm font-medium text-gray-600 mb-3 block">
                Choose Your Plan
              </label>
              <div className="space-y-3">
                {plans.map(plan => (
                  <div
                    key={plan.id}
                    onClick={() => setForm({ ...form, plan: plan.id })}
                    className={`relative border-2 rounded-2xl p-4 cursor-pointer transition-all duration-200 ${
                      form.plan === plan.id ? plan.activeColor : plan.color + ' hover:border-purple-200'
                    }`}
                  >
                    {plan.badge && (
                      <span className="absolute -top-2.5 left-4 px-2 py-0.5 bg-gradient-to-r from-purple-600 to-indigo-500 text-white text-xs rounded-full font-medium">
                        {plan.badge}
                      </span>
                    )}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          form.plan === plan.id ? 'border-purple-600' : 'border-gray-300'
                        }`}>
                          {form.plan === plan.id && (
                            <div className="w-2 h-2 rounded-full bg-purple-600" />
                          )}
                        </div>
                        <span className="font-semibold text-gray-800">{plan.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-purple-900">{plan.price}</span>
                        <span className="text-gray-400 text-xs">/{plan.period}</span>
                      </div>
                    </div>
                    <div className="ml-7 flex flex-wrap gap-x-4 gap-y-1">
                      {plan.features.slice(0, 3).map((f, i) => (
                        <span key={i} className="text-xs text-gray-500 flex items-center gap-1">
                          <Check className="w-3 h-3 text-green-500" />{f}
                        </span>
                      ))}
                      {plan.features.length > 3 && (
                        <span className="text-xs text-purple-500">+{plan.features.length - 3} more</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* View pricing details link */}
            <p className="text-center text-xs text-gray-400 mt-2">
              <span
                onClick={() => window.open('/pricing', '_blank')}
                className="text-purple-500 cursor-pointer hover:underline"
              >
                View full plan comparison →
              </span>
            </p>

            {/* Payment notice for paid plans */}
            {(form.plan === 'pro' || form.plan === 'enterprise') && !showPayment && (
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
                <p className="text-blue-700 text-sm font-medium mb-1">
                  💳 Payment Required
                </p>
                <p className="text-blue-500 text-xs mb-3">
                  {form.plan === 'pro' ? '₹999/month' : 'Custom pricing'} - Complete payment to activate your plan
                </p>
                <button
                  onClick={() => setShowPayment(true)}
                  className="w-full py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:opacity-90 transition"
                >
                  Proceed to Payment →
                </button>
              </div>
            )}

            {/* Simulated Payment Form */}
            {showPayment && (form.plan === 'pro' || form.plan === 'enterprise') && (
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 space-y-3">
                <p className="text-sm font-semibold text-gray-700">💳 Payment Details</p>
                <input
                  placeholder="Cardholder Name"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-300 text-sm"
                />
                <input
                  placeholder="Card Number (16 digits)"
                  maxLength={19}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-300 text-sm"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    placeholder="MM / YY"
                    maxLength={5}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-300 text-sm"
                  />
                  <input
                    placeholder="CVV"
                    maxLength={3}
                    type="password"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-300 text-sm"
                  />
                </div>
                <p className="text-xs text-gray-400 text-center">
                  🔒 This is a demo - no real payment will be processed
                </p>
              </div>
            )}

            {/* Submit button */}
            {(form.plan === 'free' || showPayment) && (
              <button
                onClick={handleSubmit}
                disabled={loading || !allRulesPassed || !passwordsMatch}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-500 text-white font-semibold hover:opacity-90 hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {loading ? 'Registering...' : form.plan === 'free' ? 'Register Company' : 'Pay & Register'}
              </button>
            )}

            <p className="text-center text-sm text-gray-400">
              Already registered?{' '}
              <span
                onClick={() => navigate('/company/login')}
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