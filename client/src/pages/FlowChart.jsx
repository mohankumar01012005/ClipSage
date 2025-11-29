"use client"

import { Menu, X } from "lucide-react"
import { useState } from "react"

export default function FlowChart() {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="flex h-[calc(100vh-64px)] bg-white">
      {/* Sidebar */}
      <div
        className={`${sidebarOpen ? "w-64" : "w-0"} transition-all duration-300 bg-linear-to-b from-blue-50 to-blue-25 border-r border-blue-100 flex flex-col overflow-hidden`}
      >
        <div className="p-6 text-center border-b border-blue-100">
          <div className="w-12 h-12 rounded-full bg-linear-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold mx-auto mb-3">
            🔄
          </div>
          <h3 className="text-sm font-semibold text-gray-800">Flow Chat</h3>
          <p className="text-xs text-gray-600 mt-1">Workflow Mode</p>
        </div>

        <div className="flex-1 p-4">
          <p className="text-xs text-gray-600 text-center">Workflow features pending</p>
        </div>

        <div className="p-4 border-t border-blue-100 bg-white bg-opacity-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-linear-to-br from-green-500 to-green-600 flex items-center justify-center text-white font-bold text-sm">
              FC
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800">Flow Master</p>
              <p className="text-xs text-gray-500">flow@example.com</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-150"
            >
              {sidebarOpen ? <X size={20} className="text-gray-600" /> : <Menu size={20} className="text-gray-600" />}
            </button>
            <h1 className="text-lg font-semibold text-gray-800">Flow Chat</h1>
          </div>
          <div className="text-sm text-gray-500">Workflow Features</div>
        </div>

        {/* Empty State */}
        <div className="flex-1 flex items-center justify-center bg-linear-to-br from-white via-blue-25 to-white">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-100 to-green-50 flex items-center justify-center text-4xl mx-auto mb-4">
              🌊
            </div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">Workflow Management</h2>
            <p className="text-gray-600 mb-4">
              Start a conversation in Summary Assistance to activate workflow features
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-left">
              <p className="text-sm text-gray-700">
                <span className="font-semibold text-green-600">🔗 Get Started:</span> Begin your journey in "Summary
                Assistance" to unlock workflow and process management tools.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
