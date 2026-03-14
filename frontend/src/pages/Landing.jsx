import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { ShieldCheck, UserRound, Sparkles, Languages, BarChart3, Mail } from 'lucide-react'
import Navbar from '../components/Navbar'

const features = [
  {
    icon: <Sparkles className="w-6 h-6 text-purple-400" />,
    title: "AI Powered Responses",
    description: "Groq AI handles common customer queries instantly — no human agent needed for routine questions."
  },
  {
    icon: <Languages className="w-6 h-6 text-purple-400" />,
    title: "4 Indian Languages",
    description: "Supports Hindi, Marathi, Gujarati and Punjabi. Customers write in their language, responses come back perfectly."
  },
  {
    icon: <ShieldCheck className="w-6 h-6 text-purple-400" />,
    title: "Tone Standardization",
    description: "Every response is automatically rewritten to match your brand tone — professional, empathetic, formal or friendly."
  },
  {
    icon: <UserRound className="w-6 h-6 text-purple-400" />,
    title: "Smart Escalation",
    description: "When AI can't handle a query, it escalates to your human representative automatically with full context."
  },
  {
    icon: <BarChart3 className="w-6 h-6 text-purple-400" />,
    title: "Quality Scoring",
    description: "Every response gets a quality score 0-100. Track your team's performance and improve over time."
  },
  {
    icon: <Mail className="w-6 h-6 text-purple-400" />,
    title: "Daily Digest Emails",
    description: "Every morning your manager gets a digest — total conversations, quality scores, language breakdown and worst responses."
  }
]

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 text-gray-800 overflow-hidden">

      {/* Navbar */}
      <Navbar />
       

      {/* Hero */}
      <section className="pt-44 pb-32 px-6 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-5xl md:text-7xl font-bold tracking-tight text-purple-900"
          style={{ fontFamily: 'Playfair Display, serif' }}
        >
          Speak their language, <br />
          <span className="bg-gradient-to-r from-purple-600 to-indigo-400 bg-clip-text text-transparent">
            Win their trust
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-6 max-w-2xl mx-auto text-gray-500 text-lg"
        >
          BrainWrites helps Indian businesses deliver consistent, multilingual 
          customer support — powered by AI, built for Bharat.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-10 flex flex-col sm:flex-row gap-4 justify-center"
        >
          <button
            onClick={() => navigate('/about')}
            className="px-8 py-4 rounded-xl bg-purple-600 text-white font-semibold hover:bg-purple-700 hover:scale-105 transition-all duration-200"
          >
            See How It Works
          </button>
          <button
            onClick={() => navigate('/portal')}
            className="px-8 py-4 rounded-xl border border-purple-200 text-purple-700 font-semibold hover:bg-purple-50 transition-all duration-200"
          >
            Sign In
          </button>
        </motion.div>
      </section>

      {/* Feature Cards */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="rounded-2xl bg-white/70 border border-purple-100 p-8 hover:shadow-lg hover:border-purple-200 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center mb-4">
                {f.icon}
              </div>
              <h3 className="text-lg font-semibold text-purple-900 mb-2">{f.title}</h3>
              <p className="text-sm text-gray-500">{f.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Portal Cards */}
      <section className="max-w-6xl mx-auto px-6 pb-32">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="text-center text-2xl font-bold text-purple-900 mb-10"
          style={{ fontFamily: 'Playfair Display, serif' }}
        >
          Ready to get started?
        </motion.h2>
        <div className="flex flex-col sm:flex-row gap-6 max-w-2xl mx-auto">

          {/* Company Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            onClick={() => navigate('/about')}
            className="flex-1 bg-white border border-purple-100 rounded-2xl p-8 flex flex-col items-center gap-4 cursor-pointer hover:shadow-lg hover:border-purple-300 transition-all duration-300 group"
          >
            <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition">
              <ShieldCheck className="text-purple-700 w-8 h-8" />
            </div>
            <div className="text-center">
              <h2 className="text-xl font-semibold text-purple-800">I'm a Company</h2>
              <p className="text-gray-400 text-sm mt-1">Register your business and get your support link</p>
            </div>
            <button className="mt-2 w-full py-2 rounded-xl bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 transition">
              Get Started
            </button>
          </motion.div>

          {/* Representative Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onClick={() => navigate('/portal')}
            className="flex-1 bg-white border border-indigo-100 rounded-2xl p-8 flex flex-col items-center gap-4 cursor-pointer hover:shadow-lg hover:border-indigo-300 transition-all duration-300 group"
          >
            <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center group-hover:bg-indigo-200 transition">
              <UserRound className="text-indigo-600 w-8 h-8" />
            </div>
            <div className="text-center">
              <h2 className="text-xl font-semibold text-indigo-800">I'm a Manager/Representative</h2>
              <p className="text-gray-400 text-sm mt-1">Login to handle customer conversations</p>
            </div>
            <button className="mt-2 w-full py-2 rounded-xl bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-600 transition">
              Sign In
            </button>
          </motion.div>

        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-purple-100 py-10 text-center text-sm text-gray-400">
        &copy; {new Date().getFullYear()} BrainWrites — Built for Bharat, powered by AI
      </footer>

    </div>
  )
}