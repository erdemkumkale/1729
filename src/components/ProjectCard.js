import React, { useState } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../contexts/AuthContext'

const ProjectCard = ({ project, onProposalSubmit }) => {
  const { user } = useAuth()
  const [showProposalForm, setShowProposalForm] = useState(false)
  const [proposalText, setProposalText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmitProposal = async (e) => {
    e.preventDefault()
    if (!proposalText.trim()) return

    setSubmitting(true)
    try {
      const { error } = await supabase
        .from('proposals')
        .insert([
          {
            project_id: project.id,
            applicant_id: user.id,
            offer_text: proposalText,
          },
        ])

      if (error) throw error

      setProposalText('')
      setShowProposalForm(false)
      if (onProposalSubmit) onProposalSubmit()
    } catch (error) {
      console.error('Error submitting proposal:', error)
      alert('Error submitting proposal. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const isOwnProject = project.creator_id === user?.id

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{project.title}</h3>
          <p className="text-gray-600 text-sm mb-3">{project.description}</p>
          <div className="flex items-center space-x-2">
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
              {new Date(project.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      {!isOwnProject && project.status === 'Open' && (
        <div className="mt-4">
          {!showProposalForm ? (
            <button
              onClick={() => setShowProposalForm(true)}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors text-sm font-medium"
            >
              Offer Help
            </button>
          ) : (
            <form onSubmit={handleSubmitProposal} className="space-y-3">
              <textarea
                value={proposalText}
                onChange={(e) => setProposalText(e.target.value)}
                placeholder="How can you help with this project?"
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                rows="3"
                required
              />
              <div className="flex space-x-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors text-sm font-medium disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Proposal'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowProposalForm(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {isOwnProject && (
        <div className="mt-4 p-3 bg-blue-50 rounded-md">
          <p className="text-sm text-blue-800 font-medium">Your Project</p>
        </div>
      )}
    </div>
  )
}

export default ProjectCard