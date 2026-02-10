import React from 'react'

const UserCard = ({ user, showRealName = false }) => {
  const answers = user.answers_json || {}

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center mb-4">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4"
          style={{ backgroundColor: user.color }}
        >
          {user.hex_code.slice(1, 4).toUpperCase()}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {showRealName ? user.real_name : user.hex_code}
          </h3>
          {showRealName && (
            <p className="text-sm text-gray-500">{user.hex_code}</p>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-1">Being busy with:</h4>
          <p className="text-sm text-gray-600">{answers.question1 || 'Not answered'}</p>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-1">Unfair advantage:</h4>
          <p className="text-sm text-gray-600">{answers.question2 || 'Not answered'}</p>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-1">Dream/Support needed:</h4>
          <p className="text-sm text-gray-600">{answers.question3 || 'Not answered'}</p>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-1">Would delegate:</h4>
          <p className="text-sm text-gray-600">{answers.question4 || 'Not answered'}</p>
        </div>
      </div>
    </div>
  )
}

export default UserCard