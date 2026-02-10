import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'

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

// Legacy pages
import Circles from './pages/Circles'
import ProjectDetail from './pages/ProjectDetail'
import ProjectChat from './pages/ProjectChat'
import UserProfile from './pages/UserProfile'
import AllTeams from './pages/AllTeams'

/**
 * GATE LOGIC COMPONENT
 * SIMPLE FLOW: Login -> Payment -> Onboarding -> Dashboard
 * Hex code is auto-generated, no reveal page
 */
const GateKeeper = () => {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500"></div>
      </div>
    )
  }

  // Debug logging
  console.log('🚪 GateKeeper Check:', {
    hasUser: !!user,
    hasProfile: !!profile,
    hexCode: profile?.hex_code,
    paymentStatus: profile?.payment_status,
    onboardingCompleted: profile?.onboarding_completed
  })

  // GATE 1: Not logged in → Login
  if (!user) {
    console.log('🚪 Gate 1: No user → /login')
    return <Navigate to="/login" replace />
  }

  // GATE 2: No profile yet → Wait
  if (!profile) {
    console.log('⏳ Gate 2: No profile loaded yet, waiting...')
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500"></div>
      </div>
    )
  }

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500"></div>
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

      {/* PROTECTED - Legacy Routes */}
      <Route path="/circles" element={<ProtectedRoute requirePayment={true} requireOnboarding={true}><Circles /></ProtectedRoute>} />
      <Route path="/teams" element={<ProtectedRoute requirePayment={true} requireOnboarding={true}><AllTeams /></ProtectedRoute>} />
      <Route path="/gift/:id" element={<ProtectedRoute requirePayment={true} requireOnboarding={true}><ProjectDetail /></ProtectedRoute>} />
      <Route path="/gift/:giftId/chat/:requestId" element={<ProtectedRoute requirePayment={true} requireOnboarding={true}><ProjectChat /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute requirePayment={true} requireOnboarding={true}><UserProfile /></ProtectedRoute>} />
      
      {/* ROOT */}
      <Route path="/" element={<GateKeeper />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <AppRoutes />
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App
