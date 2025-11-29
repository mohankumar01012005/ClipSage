"use client"

import { useState, useRef, useEffect } from "react"
import { Send } from "lucide-react"

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
      {!isComplete && <span className="ml-1 inline-block w-2 h-5 bg-blue-600 animate-pulse"></span>}
    </div>
  )
}

const FormattedSummary = ({ summary }) => {
  if (!summary) return null

  // Split the summary into sections
  const sections = summary.split('###').filter(section => section.trim())
  
  return (
    <div className="space-y-4">
      {sections.map((section, index) => {
        const [title, ...content] = section.split('\n').filter(line => line.trim())
        const contentText = content.join('\n').trim()
        
        return (
          <div key={index} className="space-y-2">
            <h3 className="font-bold text-blue-700 text-sm">{title}</h3>
            {contentText.includes('•') ? (
              <ul className="space-y-1 ml-4">
                {contentText.split('•').filter(item => item.trim()).map((item, idx) => (
                  <li key={idx} className="text-sm text-gray-700 flex items-start">
                    <span className="text-blue-500 mr-2">•</span>
                    <span>{item.trim()}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-700 whitespace-pre-line">{contentText}</p>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function SummaryAssistance({ selectedChat, onNewChat, onClearSelectedChat }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: "assistant",
      text: "Hello! I'm your AI assistant. You can paste a URL or ask me anything. How can I help you today?",
    },
  ])

  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(scrollToBottom, [messages])

  // Effect to load selected chat when it changes
  useEffect(() => {
    if (selectedChat) {
      console.log("📝 Loading selected chat:", selectedChat)
      
      // Create initial assistant message with the video summary
      const initialMessages = [
        {
          id: 1,
          type: "assistant",
          text: `I've loaded the summary for "${selectedChat.title}". You can ask me questions about this video!`,
          rawData: {
            title: selectedChat.title,
            summary: selectedChat.summary
          }
        }
      ]

      // Add existing chat messages if any
      if (selectedChat.messages && selectedChat.messages.length > 0) {
        selectedChat.messages.forEach((msg, index) => {
          initialMessages.push({
            id: index + 2,
            type: msg.role === "user" ? "user" : "assistant",
            text: msg.content,
            timestamp: msg.timestamp
          })
        })
      }

      setMessages(initialMessages)
      setInputValue("")
    } else {
      // Reset to initial state when no chat is selected
      setMessages([
        {
          id: 1,
          type: "assistant",
          text: "Hello! I'm your AI assistant. You can paste a URL or ask me anything. How can I help you today?",
        },
      ])
    }
  }, [selectedChat])

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!inputValue.trim()) return

    const userId = localStorage.getItem("userId")
    
    if (!userId) {
      console.error("❌ User ID not found in localStorage")
      setMessages((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          type: "assistant",
          text: "❌ Please log in again. User ID not found.",
        },
      ])
      return
    }

    const userMessage = {
      id: messages.length + 1,
      type: "user",
      text: inputValue,
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setIsLoading(true)

    try {
      if (selectedChat) {
        // Existing chat - use chat endpoint
        console.log("💬 Sending message to existing chat:", selectedChat._id)
        
        const res = await fetch(`http://localhost:5005/api/video/chat/${userId}/${selectedChat._id}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userMessage: inputValue,
          }),
        })

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`)
        }

        const data = await res.json()
        console.log("✅ Chat Response:", data)

        const aiMessage = {
          id: messages.length + 2,
          type: "assistant",
          text: data.botMessage.content,
        }

        setMessages((prev) => [...prev, aiMessage])
        
        // Refresh chat list to update last message time
        if (onNewChat) {
          setTimeout(() => onNewChat(), 500)
        }
      } else {
        // New chat - summarize URL
        console.log("📨 Sending request to summarize URL:", inputValue)

        const res = await fetch(`http://localhost:5005/api/video/summarize/${userId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            youtubeUrl: inputValue,
          }),
        })

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`)
        }

        const data = await res.json()
        console.log("✅ AI Summary Response:", data)

        // Extract title and summary from the response
        const videoTitle = data.video?.title || "Untitled Video"
        const summary = data.summary || "No summary available"

        const aiMessage = {
          id: messages.length + 2,
          type: "assistant",
          text: `🎬 **${videoTitle}**\n\n${summary}`,
          rawData: {
            title: videoTitle,
            summary: summary
          }
        }

        setMessages((prev) => [...prev, aiMessage])
        
        // Refresh chat list to show new chat
        if (onNewChat) {
          setTimeout(() => onNewChat(), 500)
        }
      }
    } catch (error) {
      console.error("❌ Error:", error)
      setMessages((prev) => [
        ...prev,
        {
          id: prev.length + 2,
          type: "assistant",
          text: selectedChat 
            ? "❌ Failed to send message. Please try again." 
            : "❌ Failed to generate summary. Please check the URL and try again.",
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleNewChat = () => {
    if (onClearSelectedChat) {
      onClearSelectedChat()
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with chat title for selected chats */}
      {selectedChat && (
        <div className="border-b border-gray-200 px-6 py-3 bg-blue-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <h2 className="text-sm font-medium text-gray-800">{selectedChat.title}</h2>
              <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded border">
                {selectedChat.messages?.length || 0} messages
              </span>
            </div>
            <button
              onClick={handleNewChat}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              New Chat
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-xl px-4 py-3 rounded-2xl ${
              message.type === "user" 
                ? "bg-blue-600 text-white" 
                : "bg-gray-100 text-gray-800"
            }`}>
              {message.type === "assistant" && message.rawData ? (
                // Formatted AI response with title and structured summary
                <div className="space-y-3">
                  <div className="font-bold text-blue-700 text-sm">
                    🎬 {message.rawData.title}
                  </div>
                  <FormattedSummary summary={message.rawData.summary} />
                </div>
              ) : message.type === "assistant" &&
                messages[messages.length - 1].id === message.id &&
                !isLoading ? (
                // Typing animation for regular assistant messages
                <TypingAnimation text={message.text} />
              ) : (
                // Regular text display
                <p className="whitespace-pre-line text-sm">{message.text}</p>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-xl px-4 py-3 rounded-2xl bg-gray-100 text-gray-800">
              <div className="flex items-center gap-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                  <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                </div>
                <span className="text-sm text-gray-600">AI is thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-gray-200 px-6 py-4 bg-white">
        <form onSubmit={handleSendMessage} className="flex gap-3">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={selectedChat ? "Ask a question about this video..." : "Paste YouTube link here..."}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className={`flex items-center justify-center w-12 h-12 rounded-full transition-colors duration-200 ${
              !inputValue.trim() || isLoading
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  )
}