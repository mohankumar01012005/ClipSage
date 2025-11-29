export default function PromptGenerator() {
  return (
    <div className="flex flex-col h-full items-center justify-center px-6 py-6 bg-gradient-to-br from-white via-blue-25 to-white">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-100 to-green-50 flex items-center justify-center mx-auto mb-4 border border-green-200">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Prompt Generator</h2>
        <p className="text-sm text-gray-600 mb-4">
          Generate custom prompts and AI commands. Start exploring in Summary Assistance first!
        </p>
        <p className="text-xs text-gray-500 italic">
          Please start a conversation with Summary Assistance to access this functionality.
        </p>
      </div>
    </div>
  )
}
