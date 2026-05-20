import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { I18nProvider } from './i18n'

// Auth Pages
import SimpleAuth from './pages/SimpleAuth'

// Flow Pages
import PaymentPage from './pages/PaymentPage'
import OnboardingFlow from './pages/OnboardingFlow'

// Main Dashboard Pages
import KontrolPaneli from './pages/KontrolPaneli'
import SoruCevap from './pages/SoruCevap'
import GuvenTakimi from './pages/GuvenTakimi'
import Al from './pages/Al'
import Ver from './pages/Ver'

// Support pages (still used)
import ProjectDetail from './pages/ProjectDetail'
import ProjectChat from './pages/ProjectChat'
import UserProfile from './pages/UserProfile'

/**
 * GATE LOGIC COMPONENT
 * SIMPLE FLOW: Login -> Payment -> Onboarding -> Dashboard
 * Hex code is auto-generated, no reveal page
 */
const GateKeeper = () => {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--background)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid var(--user-color)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  // GATE 1: Not logged in → Login
  if (!user) return <Navigate to="/login" replace />

  // GATE 2: Profile could not be loaded → back to login
  if (!profile) return <Navigate to="/login" replace />

  // GATE 3: Payment not completed → Payment
  if (profile.payment_status !== 'paid') {
    console.log('💳 Gate 3: Payment not paid → /payment')
    return <Navigate to="/payment" replace />
  }

  // GATE 4: Paid but onboarding incomplete → Onboarding
  if (!profile.onboarding_completed) {
    console.log('📝 Gate 4: Onboarding incomplete → /onboarding')
    return <Navigate to="/onboarding" replace />
  }

  // GATE 5: All complete → Dashboard
  console.log('✅ Gate 5: All complete → /dashboard')
  return <Navigate to="/dashboard" replace />
}

/**
 * PROTECTED ROUTE - Requires login
 */
const ProtectedRoute = ({ children, requirePayment = false, requireOnboarding = false }) => {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--background)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid var(--user-color)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  // Must be logged in
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Check payment requirement
  if (requirePayment && profile?.payment_status === 'pending') {
    return <Navigate to="/payment" replace />
  }

  // Check onboarding requirement
  if (requireOnboarding && !profile?.onboarding_completed) {
    return <Navigate to="/onboarding" replace />
  }

  return children
}

const AppRoutes = () => {
  const { user } = useAuth()

  return (
    <Routes>
      {/* PUBLIC ROUTE - Login/Signup */}
      <Route 
        path="/login" 
        element={user ? <GateKeeper /> : <SimpleAuth />} 
      />

      {/* PROTECTED - Payment */}
      <Route
        path="/payment"
        element={
          <ProtectedRoute>
            <PaymentPage />
          </ProtectedRoute>
        }
      />

      {/* PROTECTED - Onboarding */}
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute requirePayment={true}>
            <OnboardingFlow />
          </ProtectedRoute>
        }
      />

      {/* PROTECTED - Dashboard */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute requirePayment={true} requireOnboarding={true}>
            <KontrolPaneli />
          </ProtectedRoute>
        }
      />

      {/* PROTECTED - Questions */}
      <Route
        path="/questions"
        element={
          <ProtectedRoute requirePayment={true} requireOnboarding={true}>
            <SoruCevap />
          </ProtectedRoute>
        }
      />

      {/* PROTECTED - Trust Team */}
      <Route
        path="/trust-team"
        element={
          <ProtectedRoute requirePayment={true} requireOnboarding={true}>
            <GuvenTakimi />
          </ProtectedRoute>
        }
      />

      {/* PROTECTED - Receive */}
      <Route
        path="/receive"
        element={
          <ProtectedRoute requirePayment={true} requireOnboarding={true}>
            <Al />
          </ProtectedRoute>
        }
      />

      {/* PROTECTED - Give */}
      <Route
        path="/give"
        element={
          <ProtectedRoute requirePayment={true} requireOnboarding={true}>
            <Ver />
          </ProtectedRoute>
        }
      />

      {/* PROTECTED - Support Routes */}
      <Route path="/gift/:id" element={<ProtectedRoute requirePayment={true} requireOnboarding={true}><ProjectDetail /></ProtectedRoute>} />
      <Route path="/chat/:giftId/:requestId" element={<ProtectedRoute requirePayment={true} requireOnboarding={true}><ProjectChat /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute requirePayment={true} requireOnboarding={true}><UserProfile /></ProtectedRoute>} />
      
      {/* ROOT */}
      <Route path="/" element={<GateKeeper />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

// Reads language from profile and feeds it to I18nProvider
function I18nWrapper({ children }) {
  const { profile } = useAuth()
  return (
    <I18nProvider profileLanguage={profile?.language}>
      {children}
    </I18nProvider>
  )
}

function App() {
  // Cache busting - clear old data on load
  React.useEffect(() => {
    const hasCleared = sessionStorage.getItem('cache_cleared_v2')
    if (!hasCleared) {
      localStorage.clear()
      sessionStorage.setItem('cache_cleared_v2', 'true')
      console.log('🧹 Cache cleared')
    }
  }, [])

  return (
    <AuthProvider>
      <I18nWrapper>
        <Router>
          <div className="App">
            <AppRoutes />
          </div>
        </Router>
      </I18nWrapper>
    </AuthProvider>
  )
}

export default App
