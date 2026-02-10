import React, { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../contexts/AuthContext'

const MyProjects = () => {
  const { user } = useAuth()
  const [projects, setProjects] = useState([])
  const [proposals, setProposals] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMyProjects()
  }, [user])

  const fetchMyProjects = async () => {
    if (!user) return

    try {
      // Fetch my projects
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false })

      if (projectsError) throw projectsError

      // Fetch proposals for my projects
      const { data: proposalsData, error: proposalsError } = await supabase
        .from('proposals')
        .select(`
          *,
          profiles:applicant_id (
            hex_code,
            color,
            real_name
          ),
          projects:project_id (
            title
          )
        `)
        .in('project_id', projectsData?.map(p => p.id) || [])
        .order('created_at', { ascending: false })

      if (proposalsError) throw proposalsError

      setProjects(projectsData || [])
      setProposals(proposalsData || [])
    } catch (error) {
      console.error('Error fetching my projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptProposal = async (proposalId, projectId) => {
    try {
      const { error } = await supabase
        .from('proposals')
        .update({ status: 'Accepted' })
        .eq('id', proposalId)

      if (error) throw error

      // Refresh data
      fetchMyProjects()
      alert('Proposal accepted! A project team has been formed.')
    } catch (error) {
      console.error('Error accepting proposal:', error)
      alert('Error accepting proposal. Please try again.')
    }
  }

  const handleRejectProposal = async (proposalId) => {
    try {
      const { error } = await supabase
        .from('proposals')
        .update({ status: 'Rejected' })
        .eq('id', proposalId)

      if (error) throw error

      fetchMyProjects()
    } catch (error) {
      console.error('Error rejecting proposal:', error)
      alert('Error rejecting proposal. Please try again.')
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
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">My Projects</h1>
        <p className="mt-2 text-sm text-gray-700">
          Manage your projects and review proposals
        </p>
      </div>

      {/* My Projects */}
      <div className="mb-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Your Projects</h2>
        {projects.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            You haven't created any projects yet. Go to the Dashboard to create one!
          </p>
        ) : (
          <div className="space-y-6">
            {projects.map((project) => (
              <div key={project.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{project.title}</h3>
                    <p className="text-gray-600 mt-2">{project.description}</p>
                    <div className="flex items-center space-x-2 mt-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          project.status === 'Open'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {project.status}
                      </span>
                      <span className="text-xs text-gray-500">
                        Created {new Date(project.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Proposals for this project */}
                <div className="mt-6">
                  <h4 className="text-md font-medium text-gray-900 mb-3">
                    Proposals ({proposals.filter(p => p.project_id === project.id).length})
                  </h4>
                  {proposals.filter(p => p.project_id === project.id).length === 0 ? (
                    <p className="text-gray-500 text-sm">No proposals yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {proposals
                        .filter(p => p.project_id === project.id)
                        .map((proposal) => (
                          <div key={proposal.id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-2">
                                  <div
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                                    style={{ backgroundColor: proposal.profiles.color }}
                                  >
                                    {proposal.profiles.hex_code.slice(1, 4).toUpperCase()}
                                  </div>
                                  <span className="text-sm font-medium text-gray-900">
                                    {proposal.profiles.hex_code}
                                  </span>
                                  <span
                                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      proposal.status === 'Pending'
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : proposal.status === 'Accepted'
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-red-100 text-red-800'
                                    }`}
                                  >
                                    {proposal.status}
                                  </span>
                                </div>
                                <p className="text-gray-600 text-sm">{proposal.offer_text}</p>
                                <p className="text-xs text-gray-500 mt-2">
                                  {new Date(proposal.created_at).toLocaleDateString()}
                                </p>
                              </div>
                              {proposal.status === 'Pending' && (
                                <div className="flex space-x-2 ml-4">
                                  <button
                                    onClick={() => handleAcceptProposal(proposal.id, project.id)}
                                    className="px-3 py-1 bg-green-600 text-white text-xs rounded-md hover:bg-green-700 transition-colors"
                                  >
                                    Accept
                                  </button>
                                  <button
                                    onClick={() => handleRejectProposal(proposal.id)}
                                    className="px-3 py-1 bg-red-600 text-white text-xs rounded-md hover:bg-red-700 transition-colors"
                                  >
                                    Reject
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default MyProjects