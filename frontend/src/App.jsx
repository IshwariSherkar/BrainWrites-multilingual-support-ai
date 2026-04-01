import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import { ClerkProvider, useAuth } from '@clerk/clerk-react'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useEffect } from 'react'

// Pages
import Landing from './pages/Landing.jsx'
import About from './pages/About.jsx'
import Portal from './pages/Portal.jsx'
import Demo from './pages/Demo.jsx'
import Pricing from './pages/Pricing.jsx'


// Company
import CompanyRegister from './pages/company/Register.jsx'
import CompanyLogin from './pages/company/Login.jsx'
import CompanyDashboard from './pages/company/Dashboard.jsx'

// Manager
import ManagerLogin from './pages/manager/Login.jsx'
import ManagerRegister from './pages/manager/Register.jsx'
import ManagerDashboard from './pages/manager/Dashboard.jsx'

// Representative
import RepLogin from './pages/representative/Login.jsx'
import RepDashboard from './pages/representative/Dashboard.jsx'

// Customer
import CustomerChat from './pages/customer/Chat.jsx'

// Components
import PrivateRoute from './components/PrivateRoute.jsx'
import { setupAxiosInterceptor } from './services/api'

const CLERK_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

function AppInner() {
  const { getToken } = useAuth()

  useEffect(() => {
    setupAxiosInterceptor(getToken)
  }, [getToken])
  return (
    <Router>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Landing />} />
        <Route path="/about" element={<About />} />
        <Route path="/portal" element={<Portal />} />
        <Route path="/demo" element={<Demo />} />
        <Route path="/pricing" element={<Pricing />} />

        {/* Company */}
        <Route path="/company/register" element={<CompanyRegister />} />
        <Route path="/company/login" element={<CompanyLogin />} />
        <Route path="/company/dashboard" element={
          <PrivateRoute role="company">
            <CompanyDashboard />
          </PrivateRoute>
        } />

        {/* Manager */}
        <Route path="/manager/login" element={<ManagerLogin />} />
        <Route path="/manager/register" element={<ManagerRegister />} />
        <Route path="/manager/dashboard" element={
          <PrivateRoute role="admin">
            <ManagerDashboard />
          </PrivateRoute>
        } />

        {/* Representative */}
        <Route path="/representative/login" element={<RepLogin />} />
        <Route path="/representative/dashboard" element={
          <PrivateRoute role="representative">
            <RepDashboard />
          </PrivateRoute>
        } />

        {/* Customer - public, no login */}
        <Route path="/chat/:companySlug" element={<CustomerChat />} />
      </Routes>

      <ToastContainer
        position="top-right"
        autoClose={2000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        draggable
        theme="colored"
      />
    </Router>
  )
}

function App() {
  return (
    <ClerkProvider publishableKey={CLERK_KEY}>
      <AppInner />
    </ClerkProvider>
  )
}

export default App