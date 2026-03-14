import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { Send, Bot, User, Sparkles } from 'lucide-react'
import axios from 'axios'
import Navbar from '../components/Navbar'

const PIPELINE_STEPS = [
  { label: 'Customer Message', color: 'bg-indigo-100 text-indigo-700' },
  { label: 'Groq AI', color: 'bg-purple-100 text-purple-700' },
  { label: 'Tone Standardized', color: 'bg-green-100 text-green-700' },
  { label: 'Translated', color: 'bg-yellow-100 text-yellow-700' },
  { label: 'Quality Scored', color: 'bg-red-100 text-red-700' },
]

const LANGUAGES = [
  { id: 'hindi', label: 'Hindi', emoji: '🇮🇳', desc: 'Hinglish supported' },
  { id: 'marathi', label: 'Marathi', emoji: '🟠', desc: 'Marathi + Hindi' },
  { id: 'gujarati', label: 'Gujarati', emoji: '💛', desc: 'Gujarati + English' },
  { id: 'punjabi', label: 'Punjabi', emoji: '🟡', desc: 'Punjabi + Hindi' },
]

const TONES = ['professional', 'empathetic', 'formal', 'friendly']

export default function Demo() {
  const navigate = useNavigate()
  const [messages, setMessages] = useState([])
  const [selectedLang, setSelectedLang] = useState('hindi')
  const [selectedTone, setSelectedTone] = useState('professional')
  const [isRunning, setIsRunning] = useState(false)
  const [isDone, setIsDone] = useState(false)
  const [activeStep, setActiveStep] = useState(-1)
  const [qualityScore, setQualityScore] = useState(null)
  const [input, setInput] = useState('')
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || isRunning) return

    const userMessage = input.trim()
    setInput('')
    setIsRunning(true)
    setIsDone(false)
    setActiveStep(-1)
    setQualityScore(null)

    // Add customer message
    setMessages(prev => [...prev, {
      id: Date.now(),
      role: 'customer',
      text: userMessage
    }])

    // Add typing indicator
    const typingId = Date.now() + 1
    setMessages(prev => [...prev, {
      id: typingId,
      role: 'ai',
      isTyping: true
    }])

    // Animate pipeline steps while waiting for API
    const animatePipeline = async () => {
      for (let i = 0; i < PIPELINE_STEPS.length; i++) {
        setActiveStep(i)
        await new Promise(r => setTimeout(r, 600))
      }
    }
    animatePipeline()

    try {
      const res = await axios.post('http://127.0.0.1:8000/api/v1/demo/chat', {
        customer_message: userMessage,
        language: selectedLang,
        tone: selectedTone
      })
      const data = res.data

      // Animate remaining steps if API returned fast
      setActiveStep(PIPELINE_STEPS.length - 1)
      await new Promise(r => setTimeout(r, 400))
      setActiveStep(-1)

      // Remove typing indicator
      setMessages(prev => prev.filter(m => m.id !== typingId))

      if (data.escalated) {
        setMessages(prev => [...prev, {
          id: Date.now(),
          role: 'ai',
          text: `⚡ This query needs a human representative — ${data.escalation_reason}`,
          label: 'Escalated to representative'
        }])
      } else {
        setMessages(prev => [...prev, {
          id: Date.now(),
          role: 'ai',
          text: data.final_response,
          label: `${data.applied_tone} tone · ${data.detected_language} | Score: ${data.quality_score}/100`
        }])
        setQualityScore(data.quality_score)
      }

    } catch (err) {
      setMessages(prev => prev.filter(m => m.id !== typingId))
      setMessages(prev => [...prev, {
        id: Date.now(),
        role: 'ai',
        text: 'Demo service unavailable. Please make sure the backend is running.',
        label: null
      }])
      setActiveStep(-1)
    } finally {
      setIsRunning(false)
      setIsDone(true)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const resetDemo = () => {
    setMessages([])
    setActiveStep(-1)
    setQualityScore(null)
    setIsDone(false)
    setInput('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">

      <Navbar/>

      <div className="max-w-5xl mx-auto px-6 pt-32 pb-20">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1
            className="text-4xl md:text-5xl font-bold text-purple-900 mb-4"
            style={{ fontFamily: 'Playfair Display, serif' }}
          >
            See It In{' '}
            <span className="bg-gradient-to-r from-purple-600 to-indigo-400 bg-clip-text text-transparent">
              Action
            </span>
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Type in any Indian language — watch Groq AI, tone standardization
            and translation work live through our real pipeline.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Chat Window */}
          <div className="lg:col-span-2">
            <div className="bg-white/80 backdrop-blur border border-purple-100 rounded-3xl overflow-hidden shadow-xl">

              {/* Chat Header */}
              <div className="bg-gradient-to-r from-purple-600 to-indigo-500 px-6 py-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">
                    BrainWrites AI
                  </p>
                  <p className="text-purple-200 text-xs capitalize">
                    {selectedLang} · {selectedTone} tone — Live
                  </p>
                </div>
                <div className="ml-auto flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-white text-xs">Live</span>
                </div>
              </div>

              {/* Messages */}
              <div className="h-96 overflow-y-auto p-6 space-y-4">
                {messages.length === 0 && !isRunning && (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 rounded-full bg-purple-50 flex items-center justify-center mb-4">
                      <Sparkles className="w-8 h-8 text-purple-400" />
                    </div>
                    <p className="text-gray-400 text-sm mb-1">
                      Type a message in {selectedLang}
                    </p>
                    <p className="text-gray-300 text-xs">
                      e.g. "mera order 3 din se nahi aaya, please help karo"
                    </p>
                  </div>
                )}

                <AnimatePresence>
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-3 ${
                        msg.role === 'customer' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {msg.role === 'ai' && (
                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center shrink-0 mt-1">
                          <Bot className="w-4 h-4 text-purple-600" />
                        </div>
                      )}

                      <div className="max-w-xs lg:max-w-sm">
                        {msg.isTyping ? (
                          <div className="bg-purple-50 border border-purple-100 rounded-2xl rounded-tl-none px-4 py-3">
                            <div className="flex gap-1 items-center">
                              <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                              <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                              <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className={`px-4 py-3 rounded-2xl text-sm ${
                              msg.role === 'customer'
                                ? 'bg-gradient-to-r from-purple-600 to-indigo-500 text-white rounded-tr-none'
                                : 'bg-purple-50 border border-purple-100 text-gray-700 rounded-tl-none'
                            }`}>
                              {msg.text}
                            </div>
                            {msg.label && (
                              <p className="text-xs text-purple-400 mt-1 ml-1">
                                ✓ {msg.label}
                              </p>
                            )}
                          </>
                        )}
                      </div>

                      {msg.role === 'customer' && (
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 mt-1">
                          <User className="w-4 h-4 text-indigo-600" />
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
                <div ref={bottomRef} />
              </div>

              {/* Input Bar */}
              <div className="px-6 py-4 border-t border-purple-50">
                <div className="flex gap-3">
                  <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isRunning}
                    placeholder={`Type in ${selectedLang}... e.g. mera order nahi aaya`}
                    className="flex-1 px-4 py-3 rounded-xl border border-purple-100 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 bg-purple-50/30 disabled:opacity-50"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={isRunning || !input.trim()}
                    className="px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-500 text-white hover:opacity-90 transition disabled:opacity-50"
                  >
                    {isRunning
                      ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      : <Send className="w-4 h-4" />
                    }
                  </button>
                </div>
                <p className="text-xs text-gray-300 mt-2 text-center">
                  Press Enter to send · Powered by BrainWrites pipeline
                </p>
              </div>
            </div>
          </div>

          {/* Right Panel */}
          <div className="space-y-4">

            {/* Language Selector */}
            <div className="bg-white/80 backdrop-blur border border-purple-100 rounded-2xl p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Customer Language
              </p>
              <div className="grid grid-cols-2 gap-2">
                {LANGUAGES.map(lang => (
                  <button
                    key={lang.id}
                    onClick={() => {
                      setSelectedLang(lang.id)
                      resetDemo()
                    }}
                    disabled={isRunning}
                    className={`py-2 px-3 rounded-xl text-xs font-medium border transition text-left ${
                      selectedLang === lang.id
                        ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white border-transparent'
                        : 'border-purple-100 text-gray-500 hover:border-purple-300'
                    }`}
                  >
                    <span className="block">{lang.emoji} {lang.label}</span>
                    <span className={`text-xs ${
                      selectedLang === lang.id ? 'text-purple-100' : 'text-gray-300'
                    }`}>
                      {lang.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tone Selector */}
            <div className="bg-white/80 backdrop-blur border border-purple-100 rounded-2xl p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Response Tone
              </p>
              <div className="grid grid-cols-2 gap-2">
                {TONES.map(tone => (
                  <button
                    key={tone}
                    onClick={() => setSelectedTone(tone)}
                    disabled={isRunning}
                    className={`py-2 px-3 rounded-xl text-xs font-medium border transition capitalize ${
                      selectedTone === tone
                        ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white border-transparent'
                        : 'border-purple-100 text-gray-500 hover:border-purple-300'
                    }`}
                  >
                    {tone}
                  </button>
                ))}
              </div>
            </div>

            {/* Reset Button */}
            {isDone && (
              <button
                onClick={resetDemo}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-500 text-white font-semibold hover:opacity-90 hover:scale-[1.02] transition-all duration-200 shadow-lg"
              >
                🔄 New Conversation
              </button>
            )}

            {/* Pipeline Steps */}
            <div className="bg-white/80 backdrop-blur border border-purple-100 rounded-2xl p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
                AI Pipeline
              </p>
              <div className="space-y-2">
                {PIPELINE_STEPS.map((step, i) => (
                  <motion.div
                    key={i}
                    animate={{
                      scale: activeStep === i ? 1.03 : 1,
                      opacity: activeStep === i ? 1 : 0.6
                    }}
                    className={`px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-2 transition-all ${step.color}`}
                  >
                    <div className={`w-2 h-2 rounded-full ${
                      activeStep === i ? 'bg-current animate-pulse' : 'bg-current opacity-40'
                    }`} />
                    {step.label}
                    {activeStep === i && (
                      <span className="ml-auto text-xs">●</span>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Quality Score */}
            <AnimatePresence>
              {qualityScore && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white/80 backdrop-blur border border-green-100 rounded-2xl p-5"
                >
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    Quality Score
                  </p>
                  <div className="flex items-end gap-2 mb-3">
                    <span className="text-4xl font-bold text-green-600">
                      {qualityScore}
                    </span>
                    <span className="text-gray-400 mb-1">/100</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${qualityScore}%` }}
                      transition={{ duration: 1, delay: 0.2 }}
                      className="h-2 rounded-full bg-gradient-to-r from-green-400 to-emerald-500"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    {qualityScore >= 70 ? 'Excellent response quality'
                      : qualityScore >= 40 ? 'Good response quality'
                      : 'Response needs improvement'}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            </div>
        </div>

        {/* CTA — Full Width Below */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="mt-8 bg-gradient-to-r from-purple-600 to-indigo-500 rounded-2xl px-8 py-6 flex items-center justify-between gap-6"
        >
          <div>
            <p className="text-white font-semibold text-base">Impressed?</p>
            <p className="text-purple-200 text-xs mt-0.5">
              Register your company and go live in minutes
            </p>
          </div>
          <button
            onClick={() => navigate('/manager/register')}
            className="shrink-0 px-6 py-2.5 rounded-xl bg-white text-purple-700 font-semibold hover:scale-[1.02] transition text-sm"
          >
            Get Started Free →
          </button>
        </motion.div>
      </div>

      <footer className="border-t border-purple-100 py-8 text-center text-sm text-gray-400">
        &copy; {new Date().getFullYear()} BrainWrites — Built for Bharat, powered by AI
      </footer>

    </div>
  )
}