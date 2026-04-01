import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { Send, Bot, User, Languages } from 'lucide-react'
import { sendCustomerMessage, createConversation, getCompanyBySlug } from '../../services/api'
import { toast } from 'react-toastify'
import logo from '../../assets/logo.svg'

const languages = ['english', 'hindi', 'marathi', 'gujarati', 'punjabi']

const LANGUAGE_GREETINGS = {
  english: 'Hello! How can I help you today?',
  hindi: 'Namaste! Aaj main aapki kya madad kar sakta hoon?',
  marathi: 'Namaskar! Aaj mi tumchi kashi madad karu shakto?',
  gujarati: 'Kem cho! Aaj hu tamari shu seva kari shakun?',
  punjabi: 'Sat Sri Akal! Aj main tuhadi ki madad kar sakda haan?'
}

export default function CustomerChat() {
  const { companySlug } = useParams()
  const [step, setStep] = useState('form')
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    language: 'english'
  })
  const [companyId, setCompanyId] = useState(null)
  const [conversationId, setConversationId] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleStartChat = async () => {
    if (!form.name || !form.phone || !form.email) {
      toast.error('Please fill all fields')
      return
    }
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(form.email)) {
      toast.error('Please enter a valid email address')
      return
    }
    // Phone validation
    const phoneRegex = /^[0-9]{10}$/
    if (!phoneRegex.test(form.phone.replace(/\s+/g, ''))) {
      toast.error('Please enter a valid 10-digit phone number')
      return
    }
    setFormLoading(true)
    try {
      // Step 1 - get company ID from slug
      const companyRes = await getCompanyBySlug(companySlug)
      const cId = companyRes.data.data.company_id
      setCompanyId(cId)

      // Step 2 - create conversation with company ID header
      const res = await createConversation(
        {
          customer_name: form.name,
          customer_email: form.email,
          customer_phone: form.phone,
          customer_language: form.language
        },
        cId
      )
      const convId = res.data.data.conversationId
      setConversationId(convId)

      // Step 3 - show greeting
      setMessages([{
        id: Date.now(),
        role: 'ai',
        text: LANGUAGE_GREETINGS[form.language]
      }])
      setStep('chat')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to start chat. Please try again.')
    } finally {
      setFormLoading(false)
    }
  }

  const handleSend = async () => {
    if (!input.trim() || !conversationId) return

    const userMessage = input.trim()
    setInput('')

    setMessages(prev => [...prev, {
      id: Date.now(),
      role: 'customer',
      text: userMessage
    }])

    const typingId = Date.now() + 1
    setMessages(prev => [...prev, {
      id: typingId,
      role: 'ai',
      isTyping: true
    }])

    setSending(true)
    try {
      const res = await sendCustomerMessage(
        conversationId,
        {
          customer_message: userMessage,
          customer_language: form.language
        },
        companyId
      )

      const data = res.data.data
      setMessages(prev => [
        ...prev.filter(m => m.id !== typingId),
        {
          id: Date.now(),
          role: 'ai',
          text: data.processed_text || data.original_text,
          escalated: data.handled_by === 'escalated',
          quality_score: data.quality_score,
          handled_by: data.handled_by
        }
      ])
    } catch (err) {
      setMessages(prev => prev.filter(m => m.id !== typingId))
      toast.error('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex flex-col items-center justify-center px-4 py-8">

      <div className="mb-6 flex items-center gap-2">
        <img src={logo} alt="Logo" className="h-8 w-auto mix-blend-multiply" />
        <span className="text-sm text-gray-400 capitalize">
          {companySlug?.replace(/-/g, ' ')} Customer Support
        </span>
      </div>

      <div className="w-full max-w-lg">
        <AnimatePresence mode="wait">

          {step === 'form' && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white/80 backdrop-blur border border-purple-100 rounded-3xl p-8 shadow-xl"
            >
              <div className="h-1.5 w-full rounded-full bg-gradient-to-r from-purple-400 to-indigo-400 mb-6" />
              <h1
                className="text-2xl font-bold text-purple-900 mb-1"
                style={{ fontFamily: 'Playfair Display, serif' }}
              >
                Start a Conversation
              </h1>
              <p className="text-gray-400 text-sm mb-6">
                Tell us a bit about yourself before we begin
              </p>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600 mb-1 block">
                    Your Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="Enter your name"
                    className="w-full px-4 py-3 rounded-xl border border-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-300 text-sm bg-purple-50/30"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600 mb-1 block">
                    Phone Number <span className="text-red-400">*</span>
                  </label>
                  <input
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full px-4 py-3 rounded-xl border border-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-300 text-sm bg-purple-50/30"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600 mb-1 block">
                    Email Address <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    placeholder="you@email.com"
                    className="w-full px-4 py-3 rounded-xl border border-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-300 text-sm bg-purple-50/30"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600 mb-2 block">
                    Preferred Language
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {languages.map(lang => (
                      <button
                        key={lang}
                        onClick={() => setForm({ ...form, language: lang })}
                        className={`py-2 px-3 rounded-xl text-sm font-medium border transition capitalize ${form.language === lang
                            ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white border-transparent'
                            : 'border-purple-100 text-gray-500 hover:border-purple-300'
                          }`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleStartChat}
                  disabled={formLoading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-500 text-white font-semibold hover:opacity-90 hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 mt-2"
                >
                  {formLoading ? 'Starting...' : 'Start Chat →'}
                </button>
              </div>
            </motion.div>
          )}

          {step === 'chat' && (
            <motion.div
              key="chat"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-white/80 backdrop-blur border border-purple-100 rounded-3xl overflow-hidden shadow-xl"
            >
              <div className="bg-gradient-to-r from-purple-600 to-indigo-500 px-6 py-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-white font-semibold text-sm">AI Support</p>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    <p className="text-purple-200 text-xs">Online</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-purple-200 text-xs">
                  <Languages className="w-3.5 h-3.5" />
                  <span className="capitalize">{form.language}</span>
                </div>
              </div>

              <div className="h-96 overflow-y-auto p-6 space-y-4">
                <AnimatePresence>
                  {messages.map(msg => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-2 ${msg.role === 'customer' ? 'justify-end' : 'justify-start'}`}
                    >
                      {msg.role === 'ai' && (
                        <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center shrink-0 mt-1">
                          <Bot className="w-3.5 h-3.5 text-purple-600" />
                        </div>
                      )}
                      <div className="max-w-xs">
                        {msg.isTyping ? (
                          <div className="bg-purple-50 border border-purple-100 rounded-2xl rounded-tl-none px-4 py-3">
                            <div className="flex gap-1 items-center">
                              <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                              <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                              <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                          </div>
                        ) : msg.escalated ? (
                          <div className="bg-orange-50 border border-orange-100 rounded-2xl px-4 py-3">
                            <p className="text-orange-600 text-sm">
                              ⚡ Your query has been escalated to a human representative. They will respond shortly.
                            </p>
                          </div>
                        ) : (
                          <div className={`px-4 py-3 rounded-2xl text-sm ${msg.role === 'customer'
                              ? 'bg-gradient-to-r from-purple-600 to-indigo-500 text-white rounded-tr-none'
                              : 'bg-purple-50 border border-purple-100 text-gray-700 rounded-tl-none'
                            }`}>
                            {msg.text}
                          </div>
                        )}
                      </div>
                      {msg.role === 'customer' && (
                        <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 mt-1">
                          <User className="w-3.5 h-3.5 text-indigo-600" />
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
                <div ref={bottomRef} />
              </div>

              <div className="p-4 border-t border-purple-50">
                <div className="flex gap-3">
                  <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={`Type in ${form.language}...`}
                    disabled={sending}
                    className="flex-1 px-4 py-3 rounded-xl border border-purple-100 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 bg-purple-50/30 disabled:opacity-50"
                  />
                  <button
                    onClick={handleSend}
                    disabled={sending || !input.trim()}
                    className="px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-500 text-white hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center"
                  >
                    {sending
                      ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      : <Send className="w-4 h-4" />
                    }
                  </button>
                </div>
                <p className="text-xs text-gray-300 mt-2 text-center">Press Enter to send</p>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}