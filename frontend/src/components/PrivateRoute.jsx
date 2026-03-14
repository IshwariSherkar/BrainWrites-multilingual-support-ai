import { useUser, useAuth } from '@clerk/clerk-react'
import { Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { checkManagerEmail, checkRepresentativeEmail } from '../services/api'

const PrivateRoute = ({ children, role }) => {
  const { isLoaded, isSignedIn, user } = useUser()
  const { getToken } = useAuth()
  const [status, setStatus] = useState('checking')

  useEffect(() => {
    if (role === 'company') {
      const token = localStorage.getItem('company_token')
      setStatus(token ? 'allowed' : 'redirect_login')
      return
    }

    if (!isLoaded) return

    if (!isSignedIn) {
      setStatus('redirect_login')
      return
    }

    const checkBackend = async () => {
      try {
        const email = user?.primaryEmailAddress?.emailAddress
        if (!email) {
          setStatus('redirect_login')
          return
        }

        if (role === 'admin') {
          await checkManagerEmail(email)
          setStatus('allowed')
        } else if (role === 'representative') {
          await checkRepresentativeEmail(email)
          setStatus('allowed')
        }
      } catch (err) {
        setStatus('not_authorized')
      }
    }

    checkBackend()
  }, [isLoaded, isSignedIn, role, user])

  if (status === 'checking') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
      </div>
    )
  }

  if (status === 'redirect_login') {
    if (role === 'company') return <Navigate to="/company/login" />
    if (role === 'admin') return <Navigate to="/manager/login" />
    if (role === 'representative') return <Navigate to="/representative/login" />
    return <Navigate to="/portal" />
  }

  if (status === 'not_authorized') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
        <div className="bg-white border border-red-100 rounded-3xl p-10 text-center max-w-sm shadow-xl">
          <div className="text-4xl mb-4">🚫</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Not Authorized</h2>
          <p className="text-gray-400 text-sm mb-6">
            Your email is not registered. Please contact your company admin.
          </p>
          <button
            onClick={() => window.location.href = '/portal'}
            className="px-6 py-2.5 rounded-xl bg-purple-600 text-white font-semibold text-sm hover:opacity-90 transition"
          >
            Back to Portal
          </button>
        </div>
      </div>
    )
  }

  return children
}

export default PrivateRoute