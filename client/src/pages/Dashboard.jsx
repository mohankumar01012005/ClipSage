"use client"

import { useState, useEffect } from "react"
import { MessageCircle, Plus, Search, Menu, X, LogOut, Home } from "lucide-react"
import SummaryAssistance from "./SummaryAssistance"
import FutureIntegration from "./FutureIntegration"
import Chats from "./Chats"
import PromptGenerator from "./PromptGenerator"
import { useNavigate } from "react-router-dom"

const TypingAnimation = ({ text, speed = 30 }) => {
  const [displayedText, setDisplayedText] = useState("")
  const [isComplete, setIsComplete] = useState(false)

  const navigate = useNavigate()
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

// Format date to display relative time (Today, Yesterday, etc.)
const formatDate = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now - date)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 1) {
    return "Today"
  } else if (diffDays === 2) {
    return "Yesterday"
  } else if (diffDays <= 7) {
    return `${diffDays - 1} days ago`
  } else {
    return date.toLocaleDateString()
  }
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("summary")
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const navigate = useNavigate()

  const [chatHistory, setChatHistory] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoadingChats, setIsLoadingChats] = useState(true)
  const [selectedChat, setSelectedChat] = useState(null)

  // ✅ USER STATE
  const [user, setUser] = useState({
    name: "Loading...",
    email: "Loading...",
  })

  // ✅ FETCH USER DATA FROM API
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

  // ✅ FETCH USER CHATS FROM API
  const fetchUserChats = async () => {
    const userId = localStorage.getItem("userId")
    
    if (!userId) {
      console.warn("User ID not found in localStorage")
      setIsLoadingChats(false)
      return
    }

    try {
      setIsLoadingChats(true)
      console.log("📡 Fetching user chats for userId:", userId)
      
      const res = await fetch(`http://localhost:5005/api/video/chats/${userId}`)
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }
      
      const data = await res.json()
      console.log("✅ User Chats API Response:", data)

      // Transform the API response to match our chat history format
      if (data.chats && Array.isArray(data.chats)) {
        const formattedChats = data.chats.map(chat => ({
          id: chat._id,
          title: chat.title,
          date: formatDate(chat.lastMessageAt || chat.createdAt),
          video: chat.video,
          summary: chat.summary,
          messageCount: chat.messages?.length || 0,
          lastMessageAt: chat.lastMessageAt,
          createdAt: chat.createdAt
        }))
        
        console.log("📝 Formatted Chats:", formattedChats)
        setChatHistory(formattedChats)
      } else {
        console.log("📝 No chats found or invalid format")
        setChatHistory([])
      }
    } catch (error) {
      console.error("❌ Error fetching user chats:", error)
      setChatHistory([])
    } finally {
      setIsLoadingChats(false)
    }
  }

  // Fetch chats when component mounts
  useEffect(() => {
    fetchUserChats()
  }, [])

  const handleNewChat = () => {
    // Clear selected chat when starting new chat
    setSelectedChat(null)
    setActiveTab("summary")
  }

  const handleLogout = () => {
    // Remove user data from localStorage
    localStorage.removeItem("userId")
    localStorage.removeItem("token")
    
    // Redirect to home page
    navigate("/")
  }

  const handleHomeClick = () => {
    // Navigate to home page
    navigate("/")
  }

  const handleChatClick = async (chatId) => {
    const userId = localStorage.getItem("userId")
    
    if (!userId) {
      console.error("User ID not found in localStorage")
      return
    }

    try {
      console.log("📡 Fetching chat details for chatId:", chatId)
      
      const res = await fetch(`http://localhost:5005/api/video/chat/${userId}/${chatId}`)
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }
      
      const data = await res.json()
      console.log("✅ Chat Details API Response:", data)

      if (data.chat) {
        setSelectedChat(data.chat)
        setActiveTab("summary")
      }
    } catch (error) {
      console.error("❌ Error fetching chat details:", error)
    }
  }

  const filteredHistory = chatHistory.filter((chat) =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const tabs = [
    { id: "summary", label: "Summary" },
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
          {isLoadingChats ? (
            // Loading state
            <div className="flex justify-center items-center py-8">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
              </div>
              <span className="text-sm text-gray-600 ml-2">Loading chats...</span>
            </div>
          ) : filteredHistory.length > 0 ? (
            // Chat list
            filteredHistory.map((chat) => (
              <div
                key={chat.id}
                onClick={() => handleChatClick(chat.id)}
                className={`p-3 rounded-lg hover:bg-blue-100 cursor-pointer transition-colors duration-150 border ${
                  selectedChat && selectedChat._id === chat.id 
                    ? "border-blue-400 bg-blue-50" 
                    : "border-transparent hover:border-blue-300"
                } group`}
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
                    {chat.messageCount > 0 && (
                      <p className="text-xs text-blue-500 mt-0.5">
                        {chat.messageCount} message{chat.messageCount !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            // Empty state
            <div className="text-center py-8">
              <MessageCircle size={32} className="mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-500">No chats yet</p>
              <p className="text-xs text-gray-400 mt-1">Start a new chat to see it here</p>
            </div>
          )}
        </div>

        {/* ✅ PROFILE */}
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
            <div className="flex items-center gap-4">
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
            
            {/* Home and Logout Buttons */}
            <div className="flex items-center gap-2">
              {/* Home Button */}
              <button
                onClick={handleHomeClick}
                className="cursor-pointer flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-150 border border-blue-200 hover:border-blue-300"
              >
                <Home size={16} />
                Home
              </button>
              
              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="cursor-pointer flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-150 border border-red-200 hover:border-red-300"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
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
          {activeTab === "summary" && (
            <SummaryAssistance 
              selectedChat={selectedChat}
              onNewChat={fetchUserChats}
              onClearSelectedChat={() => setSelectedChat(null)}
            />
          )}
          {activeTab === "chats" && <Chats chats={chatHistory} onChatUpdate={fetchUserChats} />}
          {activeTab === "prompt" && <PromptGenerator />}
        </div>
      </div>
    </div>
  )
}