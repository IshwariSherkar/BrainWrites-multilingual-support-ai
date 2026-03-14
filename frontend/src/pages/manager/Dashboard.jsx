import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { useUser } from '@clerk/clerk-react'
import {
  BarChart3, Users, MessageSquare, Mail, Settings,
  LogOut, TrendingUp, AlertCircle, CheckCircle,
  ChevronRight, Bell, Zap
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell, ResponsiveContainer, Legend
} from 'recharts'
import {
  getCompanyProfile,
  getAnalytics,
  getCompanyTeam,
  getAllConversations,
  triggerDigest,
  updateCompanyProfile
} from '../../services/api'
import { toast } from 'react-toastify'
import logo from '../../assets/logo.svg'

const TABS = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'conversations', label: 'Conversations', icon: MessageSquare },
  { id: 'team', label: 'Team', icon: Users },
  { id: 'settings', label: 'Settings', icon: Settings },
]

const COLORS = ['#7c3aed', '#6366f1', '#a78bfa', '#c4b5fd']

const TONE_COLORS = {
  professional: 'bg-blue-100 text-blue-700',
  empathetic: 'bg-green-100 text-green-700',
  formal: 'bg-gray-100 text-gray-700',
  friendly: 'bg-yellow-100 text-yellow-700'
}

const STATUS_COLORS = {
  open: 'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-500'
}

export default function ManagerDashboard() {
  const navigate = useNavigate()
  const { user } = useUser()
  const [activeTab, setActiveTab] = useState('overview')
  const [company, setCompany] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [team, setTeam] = useState([])
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)
  const [digestLoading, setDigestLoading] = useState(false)
  const [settings, setSettings] = useState(null)
  const [settingsLoading, setSettingsLoading] = useState(false)

  useEffect(() => {
    fetchAll()
  }, [])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [profileRes, analyticsRes, teamRes, convsRes] =
        await Promise.all([
          getCompanyProfile(),
          getAnalytics(),
          getCompanyTeam(),
          getAllConversations()
        ])
      setCompany(profileRes.data.data)
      setAnalytics(analyticsRes.data.data)
      setTeam(teamRes.data.data?.team || [])
      setConversations(convsRes.data.data || [])
      setSettings(profileRes.data.data)
    } catch (err) {
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const handleDigest = async () => {
    setDigestLoading(true)
    try {
      await triggerDigest()
      toast.success('Digest email sent successfully!')
    } catch (err) {
      toast.error('Failed to send digest')
    } finally {
      setDigestLoading(false)
    }
  }

  const handleSettingsSave = async () => {
    setSettingsLoading(true)
    try {
      await updateCompanyProfile({
        default_tone: settings.default_tone,
        output_language: settings.output_language,
        digest_enabled: settings.digest_enabled,
        ai_provider: settings.ai_provider,
        ai_api_key: settings.ai_api_key,
        ai_endpoint: settings.ai_endpoint
      })
      toast.success('Settings saved successfully!')
      fetchAll()
    } catch (err) {
      toast.error('Failed to save settings')
    } finally {
      setSettingsLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">

      {/* Top Navbar */}
      <div className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/60 border-b border-purple-100">
        <div className="max-w-7xl mx-auto px-6 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Logo" className="h-7 w-auto mix-blend-multiply" />
            <span className="text-sm font-semibold text-purple-800">
              {company?.company_name}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
              <Bell className="w-4 h-4 text-purple-600" />
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-400 to-indigo-400 flex items-center justify-center text-white text-xs font-bold">
                {user?.firstName?.[0] || 'M'}
              </div>
              <span className="text-sm text-gray-600 hidden sm:block">
                {user?.firstName}
              </span>
            </div>
            <button
              onClick={() => navigate('/')}
              className="p-2 rounded-lg hover:bg-purple-50 text-gray-400 hover:text-purple-600 transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-20 pb-10">

        {/* Tab Navigation */}
        <div className="flex gap-1 bg-white/60 backdrop-blur border border-purple-100 rounded-2xl p-1 mb-8 mt-4 w-fit">
          {TABS.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-500 text-white shadow-md'
                    : 'text-gray-500 hover:text-purple-700 hover:bg-purple-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:block">{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'overview' && (
              <OverviewTab
                company={company}
                analytics={analytics}
                conversations={conversations}
                onDigest={handleDigest}
                digestLoading={digestLoading}
              />
            )}
            {activeTab === 'conversations' && (
              <ConversationsTab conversations={conversations} />
            )}
            {activeTab === 'team' && (
              <TeamTab team={team} />
            )}
            {activeTab === 'settings' && (
              <SettingsTab
                settings={settings}
                setSettings={setSettings}
                onSave={handleSettingsSave}
                loading={settingsLoading}
                company={company}
              />
            )}
          </motion.div>
        </AnimatePresence>

      </div>
    </div>
  )
}
// ─── Overview Tab ─────────────────────────────────────
function OverviewTab({ company, analytics, conversations, onDigest, digestLoading }) {
  const openCount = conversations.filter(c => c.status === 'open').length
  const escalatedCount = conversations.filter(c => c.escalated).length

  const languageData = analytics?.language_distribution
    ? Object.entries(analytics.language_distribution).map(
        ([lang, count]) => ({ name: lang, value: count })
      )
    : []

  const topicData = analytics?.top_complaint_topics
    ? analytics.top_complaint_topics.map(t => ({
        name: t.topic,
        count: t.count
      }))
    : []

  return (
    <div className="space-y-6">

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Conversations',
            value: analytics?.total_conversations ?? 0,
            icon: MessageSquare,
            color: 'text-purple-600',
            bg: 'bg-purple-50'
          },
          {
            label: 'Avg Quality Score',
            value: `${analytics?.avg_quality_score ?? 0}/100`,
            icon: TrendingUp,
            color: 'text-green-600',
            bg: 'bg-green-50'
          },
          {
            label: 'Open Conversations',
            value: openCount,
            icon: CheckCircle,
            color: 'text-blue-600',
            bg: 'bg-blue-50'
          },
          {
            label: 'Escalated',
            value: escalatedCount,
            icon: AlertCircle,
            color: 'text-orange-600',
            bg: 'bg-orange-50'
          }
        ].map((stat, i) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white/80 backdrop-blur border border-purple-100 rounded-2xl p-5"
            >
              <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
              <p className="text-xs text-gray-400 mt-1">{stat.label}</p>
            </motion.div>
          )
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Language Distribution */}
        <div className="bg-white/80 backdrop-blur border border-purple-100 rounded-2xl p-6">
          <h3 className="font-semibold text-gray-700 mb-4">Language Distribution</h3>
          {languageData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={languageData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {languageData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-300 text-sm">
              No data yet
            </div>
          )}
        </div>

        {/* Complaint Topics */}
        <div className="bg-white/80 backdrop-blur border border-purple-100 rounded-2xl p-6">
          <h3 className="font-semibold text-gray-700 mb-4">Top Complaint Topics</h3>
          {topicData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={topicData}>
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide />
                <Tooltip />
                <Bar dataKey="count" fill="#7c3aed" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-300 text-sm">
              No data yet
            </div>
          )}
        </div>
      </div>

      {/* Digest Button */}
      <div className="bg-white/80 backdrop-blur border border-purple-100 rounded-2xl p-6 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-700">Daily Digest Email</h3>
          <p className="text-sm text-gray-400 mt-1">
            Send yesterday's support summary to your inbox now
          </p>
        </div>
        <button
          onClick={onDigest}
          disabled={digestLoading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-500 text-white text-sm font-semibold hover:opacity-90 transition disabled:opacity-50"
        >
          <Mail className="w-4 h-4" />
          {digestLoading ? 'Sending...' : 'Send Digest Now'}
        </button>
      </div>

    </div>
  )
}

// ─── Conversations Tab ────────────────────────────────
function ConversationsTab({ conversations }) {
  const [search, setSearch] = useState('')

  const filtered = conversations.filter(c =>
    c.customer_name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search by customer name..."
        className="w-full max-w-sm px-4 py-2.5 rounded-xl border border-purple-100 bg-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
      />

      <div className="bg-white/80 backdrop-blur border border-purple-100 rounded-2xl overflow-hidden">
        <div className="grid grid-cols-5 px-6 py-3 border-b border-purple-50 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          <span>Customer</span>
          <span>Language</span>
          <span>Topic</span>
          <span>Score</span>
          <span>Status</span>
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-300 text-sm">
            No conversations yet
          </div>
        ) : (
          filtered.map((conv, i) => (
            <motion.div
              key={conv.conversationId}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.05 }}
              className="grid grid-cols-5 px-6 py-4 border-b border-purple-50 hover:bg-purple-50/50 transition cursor-pointer items-center"
            >
              <span className="text-sm font-medium text-gray-700">
                {conv.customer_name}
              </span>
              <span className="text-xs px-2 py-1 rounded-lg bg-indigo-50 text-indigo-600 w-fit capitalize">
                {conv.customer_language}
              </span>
              <span className="text-xs text-gray-400 capitalize">
                {conv.complaint_topic || 'general'}
              </span>
              <span className={`text-sm font-semibold ${
                conv.quality_score >= 70
                  ? 'text-green-600'
                  : conv.quality_score >= 40
                  ? 'text-yellow-600'
                  : 'text-red-500'
              }`}>
                {conv.quality_score ?? '—'}/100
              </span>
              <span className={`text-xs px-2 py-1 rounded-lg w-fit capitalize ${
                STATUS_COLORS[conv.status] || 'bg-gray-100 text-gray-500'
              }`}>
                {conv.status}
              </span>
            </motion.div>
          ))
        )}
      </div>
    </div>
  )
}

// ─── Team Tab ─────────────────────────────────────────
function TeamTab({ team }) {
  return (
    <div className="space-y-4">
      <div className="bg-white/80 backdrop-blur border border-purple-100 rounded-2xl overflow-hidden">
        <div className="grid grid-cols-4 px-6 py-3 border-b border-purple-50 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          <span>Name</span>
          <span>Language</span>
          <span>Handled</span>
          <span>Avg Score</span>
        </div>

        {team.length === 0 ? (
          <div className="py-16 text-center text-gray-300 text-sm">
            No representatives yet
          </div>
        ) : (
          team.map((rep, i) => (
            <motion.div
              key={rep.userId}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.05 }}
              className="grid grid-cols-4 px-6 py-4 border-b border-purple-50 hover:bg-purple-50/50 transition items-center"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-400 to-indigo-400 flex items-center justify-center text-white text-xs font-bold">
                  {rep.full_name?.[0] || 'R'}
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {rep.full_name}
                </span>
              </div>
              <span className="text-xs px-2 py-1 rounded-lg bg-indigo-50 text-indigo-600 w-fit capitalize">
                {rep.language}
              </span>
              <span className="text-sm text-gray-600">
                {rep.total_handled ?? 0}
              </span>
              <span className={`text-sm font-semibold ${
                (rep.avg_score ?? 0) >= 70
                  ? 'text-green-600'
                  : 'text-yellow-600'
              }`}>
                {rep.avg_score ?? 0}/100
              </span>
            </motion.div>
          ))
        )}
      </div>
    </div>
  )
}

// ─── Settings Tab ─────────────────────────────────────
function SettingsTab({ settings, setSettings, onSave, loading, company }) {
  const tones = ['professional', 'empathetic', 'formal', 'friendly']
  const languages = ['english', 'hindi', 'marathi', 'gujarati', 'punjabi']
  const providers = ['groq', 'openai', 'gemini', 'claude', 'custom']

  if (!settings) return null

  const chatUrl = `${window.location.origin}/chat/${
    company?.company_name?.toLowerCase().replace(/\s+/g, '-') || 'your-company'
  }`

  return (
    <div className="max-w-2xl space-y-6">

      {/* Tone */}
      <div className="bg-white/80 backdrop-blur border border-purple-100 rounded-2xl p-6">
        <h3 className="font-semibold text-gray-700 mb-4">Default Tone</h3>
        <div className="grid grid-cols-2 gap-2">
          {tones.map(tone => (
            <button
              key={tone}
              onClick={() => setSettings({ ...settings, default_tone: tone })}
              className={`py-2 px-4 rounded-xl text-sm font-medium border transition capitalize ${
                settings.default_tone === tone
                  ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white border-transparent'
                  : 'border-purple-100 text-gray-500 hover:border-purple-300'
              }`}
            >
              {tone}
            </button>
          ))}
        </div>
      </div>

      {/* Language */}
      <div className="bg-white/80 backdrop-blur border border-purple-100 rounded-2xl p-6">
        <h3 className="font-semibold text-gray-700 mb-4">Output Language</h3>
        <div className="grid grid-cols-3 gap-2">
          {languages.map(lang => (
            <button
              key={lang}
              onClick={() => setSettings({ ...settings, output_language: lang })}
              className={`py-2 px-3 rounded-xl text-sm font-medium border transition capitalize ${
                settings.output_language === lang
                  ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white border-transparent'
                  : 'border-purple-100 text-gray-500 hover:border-purple-300'
              }`}
            >
              {lang}
            </button>
          ))}
        </div>
      </div>

      {/* AI Provider */}
      <div className="bg-white/80 backdrop-blur border border-purple-100 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-4 h-4 text-purple-600" />
          <h3 className="font-semibold text-gray-700">AI Provider</h3>
        </div>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {providers.map(provider => (
            <button
              key={provider}
              onClick={() => setSettings({ ...settings, ai_provider: provider })}
              className={`py-2 px-3 rounded-xl text-sm font-medium border transition capitalize ${
                settings.ai_provider === provider
                  ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white border-transparent'
                  : 'border-purple-100 text-gray-500 hover:border-purple-300'
              }`}
            >
              {provider}
            </button>
          ))}
        </div>
        {settings.ai_provider !== 'groq' && (
          <div className="space-y-3 mt-4">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">
                API Key
              </label>
              <input
                type="password"
                value={settings.ai_api_key || ''}
                onChange={e => setSettings({
                  ...settings, ai_api_key: e.target.value
                })}
                placeholder="Enter your API key"
                className="w-full px-4 py-2.5 rounded-xl border border-purple-100 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 bg-purple-50/30"
              />
            </div>
            {settings.ai_provider === 'custom' && (
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">
                  Custom Endpoint URL
                </label>
                <input
                  value={settings.ai_endpoint || ''}
                  onChange={e => setSettings({
                    ...settings, ai_endpoint: e.target.value
                  })}
                  placeholder="https://your-api.com/v1/chat"
                  className="w-full px-4 py-2.5 rounded-xl border border-purple-100 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 bg-purple-50/30"
                />
              </div>
            )}
          </div>
        )}
        {settings.ai_provider === 'groq' && (
          <p className="text-xs text-gray-400 mt-2">
            Using our default Groq key — upgrade to Pro to use your own
          </p>
        )}
      </div>

      {/* Digest Toggle */}
      <div className="bg-white/80 backdrop-blur border border-purple-100 rounded-2xl p-6 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-700">Daily Digest Email</h3>
          <p className="text-xs text-gray-400 mt-1">
            Receive daily support summary at 9:00 AM
          </p>
        </div>
        <button
          onClick={() => setSettings({
            ...settings,
            digest_enabled: !settings.digest_enabled
          })}
          className={`relative w-12 h-6 rounded-full transition-all duration-300 ${
            settings.digest_enabled ? 'bg-purple-600' : 'bg-gray-200'
          }`}
        >
          <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-300 ${
            settings.digest_enabled ? 'left-7' : 'left-1'
          }`} />
        </button>
      </div>

      {/* Chat URL */}
      <div className="bg-white/80 backdrop-blur border border-purple-100 rounded-2xl p-6">
        <h3 className="font-semibold text-gray-700 mb-2">Your Chat Link</h3>
        <p className="text-xs text-gray-400 mb-3">
          Share this link with your customers
        </p>
        <div className="flex gap-2">
          <input
            readOnly
            value={chatUrl}
            className="flex-1 px-4 py-2.5 rounded-xl border border-purple-100 text-sm bg-purple-50/30 text-gray-600"
          />
          <button
            onClick={() => {
              navigator.clipboard.writeText(chatUrl)
              toast.success('Link copied!')
            }}
            className="px-4 py-2.5 rounded-xl bg-purple-100 text-purple-700 text-sm font-medium hover:bg-purple-200 transition"
          >
            Copy
          </button>
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={onSave}
        disabled={loading}
        className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-500 text-white font-semibold hover:opacity-90 transition disabled:opacity-50"
      >
        {loading ? 'Saving...' : 'Save Settings'}
      </button>

    </div>
  )
}