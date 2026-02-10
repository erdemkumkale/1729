import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const DashboardLayout = ({ children }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { profile, signOut } = useAuth()

  const navigation = [
    { name: 'Kontrol Paneli', path: '/dashboard' },
    { name: 'Soru/Cevap', path: '/questions' },
    { name: 'Güven Takımı', path: '/trust-team' },
    { name: 'Al', path: '/receive' },
    { name: 'Ver', path: '/give' },
  ]

  const isActive = (path) => location.pathname === path

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Main Navigation */}
            <div className="flex space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                    isActive(item.path)
                      ? 'border-indigo-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>

            {/* Right Side: User Info + Logout */}
            <div className="flex items-center space-x-4">
              {/* User Hex Circle - Redirects to Dashboard */}
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: profile?.hex_code || '#9CA3AF' }}
                  title={profile?.hex_code || 'Loading...'}
                >
                  {profile?.hex_code ? profile.hex_code.slice(1, 4).toUpperCase() : '...'}
                </div>
              </button>

              {/* Logout Button */}
              <button
                onClick={signOut}
                className="text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors"
              >
                Çıkış Yap
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}

export default DashboardLayout
