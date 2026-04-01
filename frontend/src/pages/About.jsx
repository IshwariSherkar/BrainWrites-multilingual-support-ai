import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowRight, Bot, UserRound, Languages, BarChart3, Mail, ShieldCheck } from 'lucide-react'
import Navbar from '../components/Navbar'

const steps = [
  {
    number: "01",
    title: "Register Your Company",
    description: "Create your company account, set your preferred tone and output language. Takes less than 2 minutes."
  },
  {
    number: "02",
    title: "Share Your Chat Link",
    description: "Get your unique link like yourapp.com/chat/zomato. Share it with customers or add it to your website."
  },
  {
    number: "03",
    title: "AI Handles Support",
    description: "Customers write in any Indian language. Groq AI responds, your system standardizes tone and translates automatically."
  },
  {
    number: "04",
    title: "Get Daily Insights",
    description: "Every morning at 9am your manager gets a digest email with quality scores, language breakdown and worst responses."
  }
]

const industries = [
  { name: "Ecommerce", example: "Flipkart, Meesho, Myntra" },
  { name: "Banking", example: "HDFC, SBI, Axis" },
  { name: "Telecom", example: "Jio, Airtel, Vi" },
  { name: "Healthcare", example: "Apollo, Practo, 1mg" },
  { name: "Retail", example: "D-Mart, Reliance, Big Bazaar" },
  { name: "Other", example: "Any customer facing business" }
]

const tones = [
  { name: "Professional", desc: "Clear, formal and business appropriate" },
  { name: "Empathetic", desc: "Warm, understanding and human" },
  { name: "Formal", desc: "Strict, official and structured" },
  { name: "Friendly", desc: "Casual, approachable and conversational" }
]

export default function About() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 text-gray-800">

      {/* Navbar */}
      <Navbar />

      {/* Hero */}
      <section className="pt-40 pb-20 px-6 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl md:text-6xl font-bold text-purple-900"
          style={{ fontFamily: 'Playfair Display, serif' }}
        >
          How It Works
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-4 max-w-xl mx-auto text-gray-500 text-lg"
        >
          Everything your Indian business needs for consistent,
          multilingual customer support - powered by AI.
        </motion.p>
      </section>

      {/* How It Works Steps */}
      <section className="max-w-4xl mx-auto px-6 pb-24">
        <div className="space-y-8">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex gap-6 bg-white/70 border border-purple-100 rounded-2xl p-8 hover:shadow-md transition"
            >
              <div className="text-4xl font-bold text-purple-200 shrink-0">
                {step.number}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-purple-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-gray-500 text-sm">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* AI Pipeline Diagram */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="text-center text-2xl font-bold text-purple-900 mb-12"
          style={{ fontFamily: 'Playfair Display, serif' }}
        >
          The AI Pipeline
        </motion.h2>
        <div className="flex flex-wrap justify-center items-center gap-3">
          {[
            { icon: <UserRound className="w-5 h-5" />, label: "Customer Message", color: "bg-indigo-100 text-indigo-700" },
            { icon: <ArrowRight className="w-4 h-4" />, label: "", color: "bg-transparent text-gray-400" },
            { icon: <Bot className="w-5 h-5" />, label: "Groq AI Response", color: "bg-purple-100 text-purple-700" },
            { icon: <ArrowRight className="w-4 h-4" />, label: "", color: "bg-transparent text-gray-400" },
            { icon: <ShieldCheck className="w-5 h-5" />, label: "Tone Standardized", color: "bg-green-100 text-green-700" },
            { icon: <ArrowRight className="w-4 h-4" />, label: "", color: "bg-transparent text-gray-400" },
            { icon: <Languages className="w-5 h-5" />, label: "Translated", color: "bg-yellow-100 text-yellow-700" },
            { icon: <ArrowRight className="w-4 h-4" />, label: "", color: "bg-transparent text-gray-400" },
            { icon: <BarChart3 className="w-5 h-5" />, label: "Quality Scored", color: "bg-red-100 text-red-700" },
            { icon: <ArrowRight className="w-4 h-4" />, label: "", color: "bg-transparent text-gray-400" },
            { icon: <Mail className="w-5 h-5" />, label: "Sent to Customer", color: "bg-blue-100 text-blue-700" },
          ].map((item, i) => (
            item.label ? (
              <div
                key={i}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl ${item.color} font-medium text-sm`}
              >
                {item.icon}
                {item.label}
              </div>
            ) : (
              <div key={i} className="text-gray-300">
                {item.icon}
              </div>
            )
          ))}
        </div>

        {/* Escalation note */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="mt-8 text-center bg-orange-50 border border-orange-100 rounded-2xl p-6"
        >
          <p className="text-orange-700 text-sm font-medium">
            ⚡ When AI can't handle a query - it automatically escalates to
            your human representative with full context preserved.
          </p>
        </motion.div>
      </section>

      {/* Industries */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="text-center text-2xl font-bold text-purple-900 mb-10"
          style={{ fontFamily: 'Playfair Display, serif' }}
        >
          Industries We Serve
        </motion.h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {industries.map((ind, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white/70 border border-purple-100 rounded-2xl p-6 hover:shadow-md transition"
            >
              <h3 className="font-semibold text-purple-800 mb-1">{ind.name}</h3>
              <p className="text-xs text-gray-400">{ind.example}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Tone Types */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="text-center text-2xl font-bold text-purple-900 mb-10"
          style={{ fontFamily: 'Playfair Display, serif' }}
        >
          Choose Your Brand Tone
        </motion.h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {tones.map((tone, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white/70 border border-purple-100 rounded-2xl p-6 text-center hover:shadow-md transition"
            >
              <h3 className="font-semibold text-purple-800 mb-2">{tone.name}</h3>
              <p className="text-xs text-gray-400">{tone.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-2xl mx-auto px-6 pb-32 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="bg-purple-600 rounded-3xl p-12"
        >
          <h2
            className="text-3xl font-bold text-white mb-4"
            style={{ fontFamily: 'Playfair Display, serif' }}
          >
            Ready to get started?
          </h2>
          <p className="text-purple-200 mb-8">
            Register your company and get your unique customer support
            link in under 2 minutes.
          </p>
          <button
            onClick={() => navigate('/portal')}
            className="px-8 py-4 bg-white text-purple-700 font-semibold rounded-xl hover:scale-105 transition-all duration-200"
          >
            Get Started Free
          </button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-purple-100 py-10 text-center text-sm text-gray-400">
        &copy; {new Date().getFullYear()} Major Project. All rights reserved.
      </footer>

    </div>
  )
}