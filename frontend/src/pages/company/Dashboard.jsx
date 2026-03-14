import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { toast } from 'react-toastify'
import { Users, UserPlus, LogOut, Building2, Copy, Check } from 'lucide-react'
import { getCompanyProfile, addManager, addRepresentative } from '../../services/api'
import Navbar from '../../components/Navbar'

export default function CompanyDashboard() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('managers')
  const [copied, setCopied] = useState(false)

  const [managerForm, setManagerForm] = useState({ email: '', full_name: '' })
  const [repForm, setRepForm] = useState({ email: '', full_name: '' })
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    setLoading(true)
    try {
      const res = await getCompanyProfile()
      setProfile(res.data.data)
    } catch (err) {
      toast.error('Failed to load profile')
      navigate('/company/login')
    } finally {
      setLoading(false)
    }
  }

  const handleAddManager = async () => {
    if (!managerForm.email || !managerForm.full_name) {
      toast.error('Please fill all fields')
      return
    }
    setAdding(true)
    try {
      await addManager(managerForm)
      toast.success('Manager added!')
      setManagerForm({ email: '', full_name: '' })
      fetchProfile()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to add manager')
    } finally {
      setAdding(false)
    }
  }

  const handleAddRep = async () => {
    if (!repForm.email || !repForm.full_name) {
      toast.error('Please fill all fields')
      return
    }
    setAdding(true)
    try {
      await addRepresentative(repForm)
      toast.success('Representative added!')
      setRepForm({ email: '', full_name: '' })
      fetchProfile()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to add representative')
    } finally {
      setAdding(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('company_token')
    navigate('/company/login')
  }

  const chatUrl = profile
    ? `${window.location.origin}/chat/${profile.company_name?.toLowerCase().replace(/\s+/g, '-')}`
    : ''

  const copyUrl = () => {
    navigator.clipboard.writeText(chatUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-6 pt-28 pb-16">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1
              className="text-3xl font-bold text-purple-900"
              style={{ fontFamily: 'Playfair Display, serif' }}
            >
              {profile?.company_name}
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              {profile?.industry} · {profile?.default_tone} tone · {profile?.output_language}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-purple-100 text-gray-500 hover:text-purple-600 hover:border-purple-300 transition text-sm"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </motion.div>

        {/* Chat URL Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-r from-purple-600 to-indigo-500 rounded-2xl p-6 mb-6"
        >
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="w-4 h-4 text-purple-200" />
            <p className="text-purple-200 text-xs font-medium uppercase tracking-wider">
              Your Customer Chat URL
            </p>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-white font-mono text-sm flex-1 truncate">
              {chatUrl}
            </p>
            <button
              onClick={copyUrl}
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-white text-xs transition"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <p className="text-purple-200 text-xs mt-2">
            Share this link with your customers
          </p>
        </motion.div>

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="grid grid-cols-2 gap-4 mb-6"
        >
          <div className="bg-white/80 backdrop-blur border border-purple-100 rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">
                  {profile?.manager_emails?.length || 0}
                </p>
                <p className="text-xs text-gray-400">Managers</p>
              </div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur border border-purple-100 rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">
                  {profile?.representative_emails?.length || 0}
                </p>
                <p className="text-xs text-gray-400">Representatives</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/80 backdrop-blur border border-purple-100 rounded-3xl p-6 shadow-xl"
        >
          <div className="flex gap-2 mb-6">
            {['managers', 'representatives'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition capitalize ${
                  activeTab === tab
                    ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white'
                    : 'border border-purple-100 text-gray-500 hover:border-purple-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'managers' ? (
              <motion.div
                key="managers"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
              >
                {/* Add Manager Form */}
                <div className="space-y-3 mb-6">
                  <p className="text-sm font-semibold text-gray-600">Add Manager</p>
                  <input
                    value={managerForm.full_name}
                    onChange={e => setManagerForm({ ...managerForm, full_name: e.target.value })}
                    placeholder="Full name"
                    className="w-full px-4 py-3 rounded-xl border border-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-300 text-sm bg-purple-50/30"
                  />
                  <input
                    value={managerForm.email}
                    onChange={e => setManagerForm({ ...managerForm, email: e.target.value })}
                    placeholder="manager@email.com"
                    type="email"
                    className="w-full px-4 py-3 rounded-xl border border-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-300 text-sm bg-purple-50/30"
                  />
                  <button
                    onClick={handleAddManager}
                    disabled={adding}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-500 text-white text-sm font-semibold hover:opacity-90 transition disabled:opacity-50"
                  >
                    {adding ? 'Adding...' : '+ Add Manager'}
                  </button>
                </div>

                {/* Manager List */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Current Managers ({profile?.manager_emails?.length || 0})
                  </p>
                  {profile?.manager_emails?.length === 0 && (
                    <p className="text-gray-300 text-sm py-4 text-center">No managers added yet</p>
                  )}
                  {profile?.manager_emails?.map((email, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 px-4 py-3 bg-purple-50/50 rounded-xl"
                    >
                      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 text-xs font-bold">
                        {email[0].toUpperCase()}
                      </div>
                      <p className="text-sm text-gray-600">{email}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="representatives"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
              >
                {/* Add Rep Form */}
                <div className="space-y-3 mb-6">
                  <p className="text-sm font-semibold text-gray-600">Add Representative</p>
                  <input
                    value={repForm.full_name}
                    onChange={e => setRepForm({ ...repForm, full_name: e.target.value })}
                    placeholder="Full name"
                    className="w-full px-4 py-3 rounded-xl border border-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-300 text-sm bg-purple-50/30"
                  />
                  <input
                    value={repForm.email}
                    onChange={e => setRepForm({ ...repForm, email: e.target.value })}
                    placeholder="rep@email.com"
                    type="email"
                    className="w-full px-4 py-3 rounded-xl border border-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-300 text-sm bg-purple-50/30"
                  />
                  <button
                    onClick={handleAddRep}
                    disabled={adding}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-500 text-white text-sm font-semibold hover:opacity-90 transition disabled:opacity-50"
                  >
                    {adding ? 'Adding...' : '+ Add Representative'}
                  </button>
                </div>

                {/* Rep List */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Current Representatives ({profile?.representative_emails?.length || 0})
                  </p>
                  {profile?.representative_emails?.length === 0 && (
                    <p className="text-gray-300 text-sm py-4 text-center">No representatives added yet</p>
                  )}
                  {profile?.representative_emails?.map((email, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 px-4 py-3 bg-indigo-50/50 rounded-xl"
                    >
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-bold">
                        {email[0].toUpperCase()}
                      </div>
                      <p className="text-sm text-gray-600">{email}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}