export default function Chats() {
  return (
    <div className="flex flex-col h-full items-center justify-center px-6 py-6 bg-gradient-to-br from-white via-blue-25 to-white">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-100 to-purple-50 flex items-center justify-center mx-auto mb-4 border border-purple-200">
          <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">No Chats Yet</h2>
        <p className="text-sm text-gray-600 mb-4">
          Your chats will appear here. Start a new conversation in Summary Assistance to see them here!
        </p>
        <p className="text-xs text-gray-500 italic">
          Please start a conversation with Summary Assistance to access this functionality.
        </p>
      </div>
    </div>
  )
}
