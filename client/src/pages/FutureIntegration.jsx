export default function FutureIntegration() {
  return (
    <div className="flex flex-col h-full items-center justify-center px-6 py-6 bg-gradient-to-br from-white via-blue-25 to-white">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center mx-auto mb-4 border border-amber-200">
          <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Coming Soon</h2>
        <p className="text-sm text-gray-600 mb-4">
          Future Integration features will be available soon. Start with Summary Assistance to explore our current
          capabilities!
        </p>
        <p className="text-xs text-gray-500 italic">
          Please start a conversation in the Summary Assistance tab to unlock this functionality.
        </p>
      </div>
    </div>
  )
}
