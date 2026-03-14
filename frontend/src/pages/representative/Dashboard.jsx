import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { useUser } from '@clerk/clerk-react'
import {
  MessageSquare, Clock, CheckCircle,
  AlertCircle, LogOut, Send, Bot, User, Bell
} from 'lucide-react'
import {
  getAllConversations,
  getConversation,
  sendRepMessage,
  closeConversation
} from '../../services/api'
import { toast } from 'react-toastify'
import logo from '../../assets/logo.svg'

const TABS = [
  { id: 'active', label: 'Active', icon: MessageSquare },
  { id: 'escalated', label: 'Escalated', icon: AlertCircle },
  { id: 'history', label: 'History', icon: Clock },
]

export default function RepDashboard() {
  const navigate = useNavigate()
  const { user } = useUser()
  const [activeTab, setActiveTab] = useState('active')
  const [conversations, setConversations] = useState([])
  const [selectedConv, setSelectedConv] = useState(null)
  const [loading, setLoading] = useState(true)
  const [convLoading, setConvLoading] = useState(false)

  useEffect(() => {
    fetchConversations()
  }, [])

  const fetchConversations = async () => {
    setLoading(true)
    try {
      const res = await getAllConversations()
      setConversations(res.data.data || [])
    } catch (err) {
      toast.error('Failed to load conversations')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectConv = async (conv) => {
    setConvLoading(true)
    try {
      const res = await getConversation(conv.conversationId)
      setSelectedConv(res.data.data)
    } catch (err) {
      toast.error('Failed to load conversation')
    } finally {
      setConvLoading(false)
    }
  }

  const activeConvs = conversations.filter(
    c => c.status === 'open' && !c.escalated
  )
  const escalatedConvs = conversations.filter(
    c => c.escalated && c.status === 'open'
  )
  const historyConvs = conversations.filter(
    c => c.status === 'closed'
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">

      {/* Navbar */}
      <div className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/60 border-b border-indigo-100">
        <div className="max-w-7xl mx-auto px-6 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Logo" className="h-7 w-auto mix-blend-multiply" />
            <span className="text-sm font-semibold text-indigo-800">
              Representative Portal
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
              <Bell className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-400 to-purple-400 flex items-center justify-center text-white text-xs font-bold">
                {user?.firstName?.[0] || 'R'}
              </div>
              <span className="text-sm text-gray-600 hidden sm:block">
                {user?.firstName}
              </span>
            </div>
            <button
              onClick={() => navigate('/')}
              className="p-2 rounded-lg hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-20 pb-10">

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 mb-6 mt-4">
          {[
            {
              label: 'Active',
              value: activeConvs.length,
              icon: MessageSquare,
              color: 'text-indigo-600',
              bg: 'bg-indigo-50'
            },
            {
              label: 'Escalated',
              value: escalatedConvs.length,
              icon: AlertCircle,
              color: 'text-orange-600',
              bg: 'bg-orange-50'
            },
            {
              label: 'Closed Today',
              value: historyConvs.length,
              icon: CheckCircle,
              color: 'text-green-600',
              bg: 'bg-green-50'
            }
          ].map((stat, i) => {
            const Icon = stat.icon
            return (
              <div
                key={i}
                className="bg-white/80 backdrop-blur border border-indigo-100 rounded-2xl p-4 flex items-center gap-4"
              >
                <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-800">{stat.value}</p>
                  <p className="text-xs text-gray-400">{stat.label}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left — Conversation List */}
          <div className="lg:col-span-1">

            {/* Tabs */}
            <div className="flex gap-1 bg-white/60 backdrop-blur border border-indigo-100 rounded-2xl p-1 mb-4">
              {TABS.map(tab => {
                const Icon = tab.icon
                const count = tab.id === 'active'
                  ? activeConvs.length
                  : tab.id === 'escalated'
                  ? escalatedConvs.length
                  : historyConvs.length

                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id)
                      setSelectedConv(null)
                    }}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-500 text-white shadow-md'
                        : 'text-gray-500 hover:text-indigo-700 hover:bg-indigo-50'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {tab.label}
                    {count > 0 && (
                      <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                        activeTab === tab.id
                          ? 'bg-white/20 text-white'
                          : 'bg-indigo-100 text-indigo-600'
                      }`}>
                        {count}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Conversation List */}
            <div className="space-y-2">
              <AnimatePresence>
                {(activeTab === 'active' ? activeConvs
                  : activeTab === 'escalated' ? escalatedConvs
                  : historyConvs
                ).map((conv, i) => (
                  <motion.div
                    key={conv.conversationId}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => handleSelectConv(conv)}
                    className={`bg-white/80 backdrop-blur border rounded-2xl p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
                      selectedConv?.conversationId === conv.conversationId
                        ? 'border-indigo-300 shadow-md'
                        : 'border-indigo-100'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-semibold text-gray-700 text-sm">
                        {conv.customer_name}
                      </span>
                      {conv.escalated && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-600">
                          Escalated
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <span className="text-xs px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-600 capitalize">
                        {conv.customer_language}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-lg bg-purple-50 text-purple-600 capitalize">
                        {conv.complaint_topic || 'general'}
                      </span>
                    </div>
                    {conv.escalation_reason && (
                      <p className="text-xs text-orange-500 mt-2 truncate">
                        ⚡ {conv.escalation_reason}
                      </p>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {(activeTab === 'active' ? activeConvs
                : activeTab === 'escalated' ? escalatedConvs
                : historyConvs
              ).length === 0 && (
                <div className="py-12 text-center text-gray-300 text-sm">
                  No conversations here
                </div>
              )}
            </div>
          </div>

          {/* Right — Conversation Detail */}
          <div className="lg:col-span-2">
            {convLoading ? (
              <div className="h-96 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
              </div>
            ) : selectedConv ? (
              <ConversationDetail
                conv={selectedConv}
                onRefresh={fetchConversations}
                onClose={() => setSelectedConv(null)}
              />
            ) : (
              <div className="h-96 flex flex-col items-center justify-center text-center bg-white/60 backdrop-blur border border-indigo-100 rounded-3xl">
                <MessageSquare className="w-12 h-12 text-indigo-200 mb-3" />
                <p className="text-gray-300 text-sm">
                  Select a conversation to view
                </p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
// ─── Conversation Detail ──────────────────────────────
function ConversationDetail({ conv, onRefresh, onClose }) {
  const [response, setResponse] = useState('')
  const [sending, setSending] = useState(false)
  const [closing, setClosing] = useState(false)
  const [approved, setApproved] = useState(true)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conv])

  const handleSend = async () => {
    if (!response.trim()) {
      toast.error('Please type a response')
      return
    }
    setSending(true)
    try {
      await sendRepMessage(conv.conversationId, {
        response_text: response,
        approve_recommendation: approved
      })
      toast.success('Response sent successfully!')
      setResponse('')
      onRefresh()
    } catch (err) {
      toast.error('Failed to send response')
    } finally {
      setSending(false)
    }
  }

  const handleClose = async () => {
    setClosing(true)
    try {
      await closeConversation(conv.conversationId)
      toast.success('Conversation closed!')
      onClose()
      onRefresh()
    } catch (err) {
      toast.error('Failed to close conversation')
    } finally {
      setClosing(false)
    }
  }

  return (
    <div className="bg-white/80 backdrop-blur border border-indigo-100 rounded-3xl overflow-hidden shadow-xl flex flex-col">

      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-500 px-6 py-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-white font-semibold">
              {conv.customer_name}
            </h3>
            <div className="flex gap-2 mt-1">
              <span className="text-indigo-200 text-xs capitalize">
                {conv.customer_language}
              </span>
              <span className="text-indigo-200 text-xs">•</span>
              <span className="text-indigo-200 text-xs capitalize">
                {conv.complaint_topic || 'general'}
              </span>
              {conv.quality_score > 0 && (
                <>
                  <span className="text-indigo-200 text-xs">•</span>
                  <span className="text-indigo-200 text-xs">
                    Score: {conv.quality_score}/100
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {conv.status === 'open' && (
              <button
                onClick={handleClose}
                disabled={closing}
                className="px-3 py-1.5 rounded-xl bg-white/20 text-white text-xs font-medium hover:bg-white/30 transition disabled:opacity-50"
              >
                {closing ? 'Closing...' : 'Close Conversation'}
              </button>
            )}
          </div>
        </div>

        {/* Escalation reason */}
        {conv.escalation_reason && (
          <div className="mt-3 px-3 py-2 bg-orange-500/20 rounded-xl">
            <p className="text-orange-200 text-xs">
              ⚡ Escalated: {conv.escalation_reason}
            </p>
          </div>
        )}

        {/* Summary */}
        {conv.summary && (
          <div className="mt-3 px-3 py-2 bg-white/10 rounded-xl">
            <p className="text-indigo-100 text-xs">
              📋 Summary: {conv.summary}
            </p>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-64 max-h-96">
        {(!conv.messages || conv.messages.length === 0) ? (
          <div className="h-full flex items-center justify-center text-gray-300 text-sm">
            No messages yet
          </div>
        ) : (
          conv.messages?.map((msg, i) => (
            <motion.div
              key={msg.messageId || i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="space-y-1"
            >
              {/* Customer message */}
              <div className="flex justify-end gap-2">
                <div className="max-w-sm">
                  <div className="px-4 py-3 rounded-2xl rounded-tr-none bg-gradient-to-r from-indigo-600 to-purple-500 text-white text-sm">
                    {msg.original_text}
                  </div>
                  <p className="text-xs text-gray-400 mt-1 text-right">
                    Customer
                  </p>
                </div>
                <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 mt-1">
                  <User className="w-3.5 h-3.5 text-indigo-600" />
                </div>
              </div>

              {/* AI / Rep response */}
              {msg.processed_text && (
                <div className="flex justify-start gap-2">
                  <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center shrink-0 mt-1">
                    <Bot className="w-3.5 h-3.5 text-purple-600" />
                  </div>
                  <div className="max-w-sm">
                    <div className="px-4 py-3 rounded-2xl rounded-tl-none bg-purple-50 border border-purple-100 text-gray-700 text-sm">
                      {msg.processed_text}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-gray-400 capitalize">
                        {msg.handled_by === 'ai' ? '🤖 AI' : '👤 Representative'}
                      </p>
                      {msg.quality_score > 0 && (
                        <span className={`text-xs font-medium ${
                          msg.quality_score >= 70
                            ? 'text-green-500'
                            : msg.quality_score >= 40
                            ? 'text-yellow-500'
                            : 'text-red-500'
                        }`}>
                          {msg.quality_score}/100
                        </span>
                      )}
                    </div>

                    {/* Recommendation badge */}
                    {msg.recommendation &&
                      msg.recommendation !== msg.processed_text && (
                      <div className="mt-2 px-3 py-2 bg-yellow-50 border border-yellow-100 rounded-xl">
                        <p className="text-xs text-yellow-600 font-medium mb-1">
                          Original recommendation:
                        </p>
                        <p className="text-xs text-gray-500">
                          {msg.recommendation}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Response Input — only for open conversations */}
      {conv.status === 'open' && (
        <div className="p-4 border-t border-indigo-50 space-y-3">

          {/* Approve toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setApproved(!approved)}
              className={`relative w-10 h-5 rounded-full transition-all duration-300 ${
                approved ? 'bg-indigo-600' : 'bg-gray-200'
              }`}
            >
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-300 ${
                approved ? 'left-5' : 'left-0.5'
              }`} />
            </button>
            <span className="text-xs text-gray-500">
              {approved
                ? '✓ AI recommendation will be applied'
                : '✗ Send my text as-is'
              }
            </span>
          </div>

          {/* Text input */}
          <div className="flex gap-3">
            <textarea
              value={response}
              onChange={e => setResponse(e.target.value)}
              placeholder="Type your response..."
              rows={2}
              className="flex-1 px-4 py-3 rounded-xl border border-indigo-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-indigo-50/30 resize-none"
            />
            <button
              onClick={handleSend}
              disabled={sending}
              className="px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-500 text-white hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center"
            >
              {sending
                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <Send className="w-4 h-4" />
              }
            </button>
          </div>
        </div>
      )}

    </div>
  )
}