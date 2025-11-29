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

export default function SummaryAssistance() {
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

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!inputValue.trim()) return

    const userMessage = {
      id: messages.length + 1,
      type: "user",
      text: inputValue,
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setIsLoading(true)

    setTimeout(() => {
      const aiResponse = {
        id: messages.length + 2,
        type: "assistant",
        text: "I've received your message. I can help you analyze URLs, answer questions, and have follow-up conversations. What would you like to know more about?",
      }
      setMessages((prev) => [...prev, aiResponse])
      setIsLoading(false)
    }, 800)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 bg-gradient-to-br from-white via-blue-25 to-white">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-md lg:max-w-2xl px-4 py-3 rounded-2xl ${
                message.type === "user"
                  ? "bg-blue-600 text-white rounded-br-none"
                  : "bg-gray-100 text-gray-800 rounded-bl-none border border-gray-200"
              }`}
            >
              {message.type === "assistant" &&
              messages[messages.length - 1].id === message.id &&
              isLoading === false ? (
                <TypingAnimation text={message.text} speed={30} />
              ) : (
                <p className="text-sm leading-relaxed">{message.text}</p>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-800 border border-gray-200 px-4 py-3 rounded-2xl rounded-bl-none flex gap-2">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-100 px-6 py-4">
        <form onSubmit={handleSendMessage} className="flex gap-3">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Paste a URL or ask a question... (e.g., https://example.com or What is React?)"
            className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-full text-sm text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors duration-150"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-medium px-4 py-3 rounded-full transition-colors duration-200 flex items-center justify-center"
          >
            <Send size={18} />
          </button>
        </form>
        <p className="text-xs text-gray-500 mt-2 text-center">
          Powered by advanced AI • Your conversations are private
        </p>
      </div>
    </div>
  )
}
