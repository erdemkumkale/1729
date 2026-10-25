import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { I18nProvider } from './i18n'

// Auth Pages
import SimpleAuth from './pages/SimpleAuth'

// Flow Pages
import PaymentPage from './pages/PaymentPage'
import OnboardingFlow from './pages/OnboardingFlow'
import ResetPassword from './pages/ResetPassword'
import CommunitySetup from './pages/CommunitySetup'
import JoinPage from './pages/JoinPage'

// Main Dashboard Pages
import KontrolPaneli from './pages/KontrolPaneli'
import SoruCevap from './pages/SoruCevap'
import GuvenTakimi from './pages/GuvenTakimi'
import Al from './pages/Al'
import Ver from './pages/Ver'
import Ayarlar from './pages/Ayarlar'

// Public pages
import LandingPage from './pages/LandingPage'
import ManifestoPage from './pages/ManifestoPage'
import ContactPage from './pages/ContactPage'

// Founder-only
import AdminPanel from './pages/AdminPanel'

// Support pages (still used)
import ProjectDetail from './pages/ProjectDetail'
import ProjectChat from './pages/ProjectChat'
import UserProfile from './pages/UserProfile'

/**
 * GATE LOGIC COMPONENT
 * SIMPLE FLOW: Login -> Payment -> Onboarding -> Dashboard
 * Hex code is auto-generated, no reveal page
 */
// Payment is switched off for the pilot; flip REACT_APP_PAYMENT_REQUIRED=true to bring it back.
const PAYMENT_REQUIRED = process.env.REACT_APP_PAYMENT_REQUIRED === 'true'
const needsPayment = (profile) =>
  profile?.payment_status === 'deleted' || (PAYMENT_REQUIRED && profile?.payment_status !== 'paid')

const GateKeeper = () => {
  const { user, profile, loading, hasCommunity } = useAuth()

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
  if (needsPayment(profile)) {
    console.log('💳 Gate 3: Payment not paid → /payment')
    return <Navigate to="/payment" replace />
  }

  // GATE 4: Paid but onboarding incomplete → Onboarding
  if (!profile.onboarding_completed) {
    console.log('📝 Gate 4: Onboarding incomplete → /onboarding')
    return <Navigate to="/onboarding" replace />
  }

  // GATE 4b: Everyone belongs to a community (invited, or founds their own)
  if (!hasCommunity) return <Navigate to="/community-setup" replace />

  // GATE 5: All complete → Dashboard
  console.log('✅ Gate 5: All complete → /dashboard')
  return <Navigate to="/dashboard" replace />
}

/**
 * PROTECTED ROUTE - Requires login
 */
const ProtectedRoute = ({ children, requirePayment = false, requireOnboarding = false, requireCommunity = false }) => {
  const { user, profile, loading, hasCommunity } = useAuth()

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
  if (requirePayment && needsPayment(profile)) {
    return <Navigate to="/payment" replace />
  }

  // Check onboarding requirement
  if (requireOnboarding && !profile?.onboarding_completed) {
    return <Navigate to="/onboarding" replace />
  }

  // Check community requirement
  if (requireCommunity && !hasCommunity) {
    return <Navigate to="/community-setup" replace />
  }

  return children
}

const AppRoutes = () => {
  const { user } = useAuth()

  return (
    <Routes>
      {/* PUBLIC - Landing */}
      <Route path="/" element={user ? <GateKeeper /> : <LandingPage />} />

      {/* PUBLIC - Manifesto */}
      <Route path="/manifesto" element={<ManifestoPage />} />

      {/* PUBLIC - Contact */}
      <Route path="/iletisim" element={<ContactPage />} />

      {/* PUBLIC ROUTE - Login */}
      <Route
        path="/login"
        element={user ? <GateKeeper /> : <SimpleAuth />}
      />

      {/* PUBLIC ROUTE - Invite join (token = invitation id) */}
      <Route path="/davet/:token" element={user ? <GateKeeper /> : <JoinPage />} />

      {/* PUBLIC ROUTE - Password reset (ungated: recovery link creates a
          session, so this must render even when `user` is set) */}
      <Route path="/reset-password" element={<ResetPassword />} />

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

      {/* PROTECTED - Community setup (after onboarding, before the app) */}
      <Route
        path="/community-setup"
        element={
          <ProtectedRoute requirePayment={true} requireOnboarding={true}>
            <CommunitySetup />
          </ProtectedRoute>
        }
      />

      {/* PROTECTED - Dashboard */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute requirePayment={true} requireOnboarding={true} requireCommunity={true}>
            <KontrolPaneli />
          </ProtectedRoute>
        }
      />

      {/* PROTECTED - Questions */}
      <Route
        path="/questions"
        element={
          <ProtectedRoute requirePayment={true} requireOnboarding={true} requireCommunity={true}>
            <SoruCevap />
          </ProtectedRoute>
        }
      />

      {/* PROTECTED - Trust Team */}
      <Route
        path="/trust-team"
        element={
          <ProtectedRoute requirePayment={true} requireOnboarding={true} requireCommunity={true}>
            <GuvenTakimi />
          </ProtectedRoute>
        }
      />

      {/* PROTECTED - Receive */}
      <Route
        path="/receive"
        element={
          <ProtectedRoute requirePayment={true} requireOnboarding={true} requireCommunity={true}>
            <Al />
          </ProtectedRoute>
        }
      />

      {/* PROTECTED - Give */}
      <Route
        path="/give"
        element={
          <ProtectedRoute requirePayment={true} requireOnboarding={true} requireCommunity={true}>
            <Ver />
          </ProtectedRoute>
        }
      />

      {/* PROTECTED - Settings */}
      <Route
        path="/settings"
        element={
          <ProtectedRoute requirePayment={true} requireOnboarding={true} requireCommunity={true}>
            <Ayarlar />
          </ProtectedRoute>
        }
      />

      {/* PROTECTED - Support Routes */}
      <Route path="/gift/:id" element={<ProtectedRoute requirePayment={true} requireOnboarding={true} requireCommunity={true}><ProjectDetail /></ProtectedRoute>} />
      <Route path="/chat/:giftId/:requestId" element={<ProtectedRoute requirePayment={true} requireOnboarding={true} requireCommunity={true}><ProjectChat /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute requirePayment={true} requireOnboarding={true} requireCommunity={true}><UserProfile /></ProtectedRoute>} />

      {/* FOUNDER-ONLY - Admin (gated inside AdminPanel by REACT_APP_FOUNDER_UID) */}
      <Route path="/admin" element={<AdminPanel />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

// Reads language from profile and feeds it to I18nProvider
function I18nWrapper({ children }) {
  const { profile } = useAuth()
  return (
    <I18nProvider profileLanguage={profile?.language} profileGiftWord={profile?.gift_word}>
      {children}
    </I18nProvider>
  )
}

function App() {

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
