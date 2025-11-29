"use client"

import { useState, useEffect } from "react"
import { MessageCircle, Plus, Search, Menu, X } from "lucide-react"
import SummaryAssistance from "./SummaryAssistance"
import FutureIntegration from "./FutureIntegration"
import Chats from "./Chats"
import PromptGenerator from "./PromptGenerator"

const TypingAnimation = ({ text, speed = 30 }) => {
  const [displayedText, setDisplayedText] = useState("")
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    if (displayedText.length < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText(text.slice(0, displayedText.length + 1))
      }, speed)
      return () => clearTimeout(timer)
    } else {
      setIsComplete(true)
    }
  }, [displayedText, text, speed])

  return (
    <div>
      {displayedText}
      {!isComplete && (
        <span className="ml-1 inline-block w-2 h-5 bg-blue-600 animate-pulse"></span>
      )}
    </div>
  )
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("summary")
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const [chatHistory, setChatHistory] = useState([
    { id: 1, title: "Understanding React Hooks", date: "Today" },
    { id: 2, title: "Web Development Best Practices", date: "Yesterday" },
    { id: 3, title: "AI and Machine Learning Basics", date: "2 days ago" },
    { id: 4, title: "Database Design Patterns", date: "1 week ago" },
  ])

  const [searchQuery, setSearchQuery] = useState("")

  // ✅ USER STATE
  const [user, setUser] = useState({
    name: "Loading...",
    email: "Loading...",
  })

  // ✅ FETCH USER DATA FROM API (FIXED)
  useEffect(() => {
    const userId = localStorage.getItem("userId")

    if (!userId) {
      console.warn("User ID not found in localStorage")
      return
    }

    const fetchUser = async () => {
      try {
        const res = await fetch(
          `http://localhost:5005/api/auth/getUser/${userId}`
        )
        const data = await res.json()

        console.log("✅ Fetched User Data:", data)

        // ✅ CORRECT DATA MAPPING
        setUser({
          name: data?.user?.username || "User",
          email: data?.user?.email || "No Email",
        })
      } catch (error) {
        console.error("❌ Error fetching user:", error)
      }
    }

    fetchUser()
  }, [])

  const handleNewChat = () => {
    setChatHistory((prev) => [
      { id: Date.now(), title: "New Chat", date: "Now" },
      ...prev,
    ])
  }

  const filteredHistory = chatHistory.filter((chat) =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const tabs = [
    { id: "summary", label: "Summary" },
    // { id: "future", label: "Future Integration" },
    { id: "chats", label: "Chats" },
    { id: "prompt", label: "Prompt Generator" },
  ]

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <div
        className={`${sidebarOpen ? "w-64" : "w-0"} transition-all duration-300 bg-gradient-to-b from-blue-50 to-blue-25 border-r border-blue-100 flex flex-col overflow-hidden`}
      >
        {/* New Chat Button */}
        <div className="p-4 border-b border-blue-100">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-3 rounded-lg transition-colors duration-200"
          >
            <Plus size={18} />
            <span>New Chat</span>
          </button>
        </div>

        {/* Search Chats */}
        <div className="p-4 border-b border-blue-100">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-3 text-blue-400" />
            <input
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-blue-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredHistory.map((chat) => (
            <div
              key={chat.id}
              className="p-3 rounded-lg hover:bg-blue-100 cursor-pointer transition-colors duration-150 border border-transparent hover:border-blue-300 group"
            >
              <div className="flex items-start gap-2">
                <MessageCircle
                  size={16}
                  className="text-blue-500 flex-shrink-0 mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate group-hover:text-blue-600">
                    {chat.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{chat.date}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ✅ PROFILE (NOW WORKING PERFECTLY) */}
        <div className="p-4 border-t border-blue-100 bg-white bg-opacity-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
              {user.name?.charAt(0)?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800">{user.name}</p>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-150"
            >
              {sidebarOpen ? (
                <X size={20} className="text-gray-600" />
              ) : (
                <Menu size={20} className="text-gray-600" />
              )}
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-8 border-b border-gray-200">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 px-2 font-medium text-sm transition-colors duration-200 relative ${
                  activeTab === tab.id
                    ? "text-blue-600"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content Container */}
        <div className="flex-1 overflow-hidden">
          {activeTab === "summary" && <SummaryAssistance />}
          {/* {activeTab === "future" && <FutureIntegration />} */}
          {activeTab === "chats" && <Chats />}
          {activeTab === "prompt" && <PromptGenerator />}
        </div>
      </div>
    </div>
  )
}
