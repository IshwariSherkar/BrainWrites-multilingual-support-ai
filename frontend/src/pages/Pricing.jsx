import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { Check, X, Zap } from 'lucide-react'
import Navbar from '../components/Navbar'

const plans = [
  {
    name: 'Free',
    price: '₹0',
    period: 'forever',
    description: 'Perfect for trying out the platform',
    color: 'border-gray-200',
    buttonStyle: 'border border-purple-200 text-purple-700 hover:bg-purple-50',
    badge: null,
    features: [
      { text: '50 conversations/month', included: true },
      { text: '1 language (English)', included: true },
      { text: 'Groq AI only', included: true },
      { text: 'Professional tone', included: true },
      { text: '1 representative', included: true },
      { text: 'Basic quality scoring', included: true },
      { text: 'Email digest', included: false },
      { text: 'Analytics dashboard', included: false },
      { text: 'Own AI provider', included: false },
      { text: 'Custom tone', included: false },
      { text: 'Priority support', included: false },
    ]
  },
  {
    name: 'Pro',
    price: '₹999',
    period: 'per month',
    description: 'For growing businesses with real support needs',
    color: 'border-purple-400',
    buttonStyle: 'bg-gradient-to-r from-purple-600 to-indigo-500 text-white hover:opacity-90',
    badge: 'Most Popular',
    features: [
      { text: '500 conversations/month', included: true },
      { text: 'All 4 Indian languages', included: true },
      { text: 'Any AI provider', included: true },
      { text: 'All tone types', included: true },
      { text: 'Up to 5 representatives', included: true },
      { text: 'Advanced quality scoring', included: true },
      { text: 'Daily email digest', included: true },
      { text: 'Analytics dashboard', included: true },
      { text: 'Own AI API key', included: true },
      { text: 'Custom tone', included: false },
      { text: 'Priority support', included: false },
    ]
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: 'contact us',
    description: 'For large companies with high volume needs',
    color: 'border-indigo-300',
    buttonStyle: 'border border-indigo-200 text-indigo-700 hover:bg-indigo-50',
    badge: null,
    features: [
      { text: 'Unlimited conversations', included: true },
      { text: 'All 4 Indian languages', included: true },
      { text: 'Any AI provider', included: true },
      { text: 'All tone types', included: true },
      { text: 'Unlimited representatives', included: true },
      { text: 'Advanced quality scoring', included: true },
      { text: 'Daily email digest', included: true },
      { text: 'Analytics dashboard', included: true },
      { text: 'Own AI API key', included: true },
      { text: 'Custom tone training', included: true },
      { text: 'Priority support', included: true },
    ]
  }
]

const faqs = [
  {
    q: 'Do I need to pay for AI calls?',
    a: 'No. On Pro and Enterprise you bring your own API key. You pay your AI provider directly. We only charge for tone standardization and translation.'
  },
  {
    q: 'Which AI providers are supported?',
    a: 'Groq (default, free), OpenAI GPT-4, Google Gemini, Anthropic Claude, and any custom endpoint.'
  },
  {
    q: 'Can I change my plan later?',
    a: 'Yes, you can upgrade or downgrade at any time from your dashboard settings.'
  },
  {
    q: 'Is my API key safe?',
    a: 'Yes. Your API key is encrypted at rest and never shared with anyone. It is only used to make requests on your behalf.'
  }
]

export default function Pricing() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">

      {/* Navbar */}
      <Navbar />

      <div className="max-w-6xl mx-auto px-6 pt-32 pb-20">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1
            className="text-4xl md:text-6xl font-bold text-purple-900 mb-4"
            style={{ fontFamily: 'Playfair Display, serif' }}
          >
            Simple,{' '}
            <span className="bg-gradient-to-r from-purple-600 to-indigo-400 bg-clip-text text-transparent">
              Transparent
            </span>{' '}
            Pricing
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            You bring your AI. We handle tone, translation and quality.
            No hidden fees, no per-message charges.
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
          {plans.map((plan, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`relative bg-white/80 backdrop-blur border-2 ${plan.color} rounded-3xl p-8 flex flex-col ${
                plan.badge ? 'shadow-xl shadow-purple-100' : ''
              }`}
            >
              {/* Badge */}
              {plan.badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="flex items-center gap-1 px-4 py-1.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-500 text-white text-xs font-semibold shadow-lg">
                    <Zap className="w-3 h-3" />
                    {plan.badge}
                  </div>
                </div>
              )}

              {/* Plan Header */}
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-800 mb-1">
                  {plan.name}
                </h2>
                <p className="text-gray-400 text-sm mb-4">
                  {plan.description}
                </p>
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-bold text-purple-900">
                    {plan.price}
                  </span>
                  <span className="text-gray-400 text-sm mb-1">
                    /{plan.period}
                  </span>
                </div>
              </div>

              {/* Gradient divider */}
              <div className="h-px w-full bg-gradient-to-r from-purple-200 via-indigo-200 to-transparent mb-6" />

              {/* Features */}
              <div className="space-y-3 flex-1 mb-8">
                {plan.features.map((feature, j) => (
                  <div key={j} className="flex items-center gap-3">
                    {feature.included ? (
                      <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 text-green-600" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                        <X className="w-3 h-3 text-gray-300" />
                      </div>
                    )}
                    <span className={`text-sm ${
                      feature.included ? 'text-gray-600' : 'text-gray-300'
                    }`}>
                      {feature.text}
                    </span>
                  </div>
                ))}
              </div>

              {/* Button */}
              <button
                onClick={() => navigate(
                  plan.name === 'Enterprise'
                    ? '/portal'
                    : '/manager/register'
                )}
                className={`w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 hover:scale-[1.02] ${plan.buttonStyle}`}
              >
                {plan.name === 'Free' && 'Get Started Free'}
                {plan.name === 'Pro' && 'Start Free Trial'}
                {plan.name === 'Enterprise' && 'Contact Us'}
              </button>

            </motion.div>
          ))}
        </div>

        {/* AI Provider Note */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="bg-gradient-to-r from-purple-600 to-indigo-500 rounded-3xl p-8 mb-24 text-center"
        >
          <h2
            className="text-2xl font-bold text-white mb-3"
            style={{ fontFamily: 'Playfair Display, serif' }}
          >
            Bring Your Own AI
          </h2>
          <p className="text-purple-100 max-w-2xl mx-auto mb-6">
            On Pro and Enterprise plans, connect your own Groq, OpenAI,
            Gemini, Claude or custom AI endpoint. Your model, your data,
            your costs. We only charge for the tone standardization
            and translation pipeline.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {['Groq', 'OpenAI', 'Gemini', 'Claude', 'Custom'].map(
              (provider) => (
                <span
                  key={provider}
                  className="px-4 py-2 bg-white/20 rounded-xl text-white text-sm font-medium"
                >
                  {provider}
                </span>
              )
            )}
          </div>
        </motion.div>

        {/* FAQ */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="max-w-2xl mx-auto"
        >
          <h2
            className="text-3xl font-bold text-purple-900 text-center mb-10"
            style={{ fontFamily: 'Playfair Display, serif' }}
          >
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white/80 backdrop-blur border border-purple-100 rounded-2xl p-6"
              >
                <h3 className="font-semibold text-purple-900 mb-2">
                  {faq.q}
                </h3>
                <p className="text-gray-500 text-sm">{faq.a}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

      </div>

      {/* Footer */}
      <footer className="border-t border-purple-100 py-8 text-center text-sm text-gray-400">
        &copy; {new Date().getFullYear()} Major Project. All rights reserved.
      </footer>

    </div>
  )
}