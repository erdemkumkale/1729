import React, { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import UserCard from '../components/UserCard'

const MyTeam = () => {
  const { user } = useAuth()
  const [invitedUsers, setInvitedUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)

  useEffect(() => {
    fetchInvitedUsers()
  }, [user])

  const fetchInvitedUsers = async () => {
    if (!user) return

    try {
      // Fetch users that I invited (I can see their real names)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('invited_by_user_id', user.id)

      if (error) throw error
      setInvitedUsers(data || [])
    } catch (error) {
      console.error('Error fetching invited users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSendInvite = async (e) => {
    e.preventDefault()
    if (!inviteEmail.trim()) return

    setInviting(true)
    try {
      // Generate invitation token
      const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

      const { error } = await supabase
        .from('invitations')
        .insert([
          {
            inviter_id: user.id,
            email: inviteEmail,
            token: token,
          },
        ])

      if (error) throw error

      // In a real app, you would send an email with the invitation link
      alert(`Invitation sent to ${inviteEmail}! Share this invitation code: ${token}`)
      setInviteEmail('')
      setShowInviteForm(false)
    } catch (error) {
      console.error('Error sending invite:', error)
      alert('Error sending invitation. Please try again.')
    } finally {
      setInviting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500"></div>
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Direct Team</h1>
          <p className="mt-2 text-sm text-gray-700">
            People you invited - you can see their real names
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => setShowInviteForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Send Invitation
          </button>
        </div>
      </div>

      {/* Invite Form Modal */}
      {showInviteForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Send Invitation</h3>
              <form onSubmit={handleSendInvite} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="friend@example.com"
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    disabled={inviting}
                    className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
                  >
                    {inviting ? 'Sending...' : 'Send Invitation'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowInviteForm(false)}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Invited Users */}
      {invitedUsers.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No team members yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Start building your network by inviting people you trust.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {invitedUsers.map((user) => (
            <UserCard key={user.id} user={user} showRealName={true} />
          ))}
        </div>
      )}
    </div>
  )
}

export default MyTeam