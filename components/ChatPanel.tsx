"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, X, Minimize2, Maximize2 } from "lucide-react"

interface ChatMessage {
  id: string
  text: string
  isUser: boolean
  timestamp: Date
}

interface ChatPanelProps {
  onClose: () => void
  isMinimized: boolean
  onToggleMinimize: () => void
}

export function ChatPanel({ onClose, isMinimized, onToggleMinimize }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      text: "こんにちは！デザインについて何かご質問はありますか？",
      isUser: false,
      timestamp: new Date(),
    },
  ])
  const [inputText, setInputText] = useState("")

  const handleSendMessage = () => {
    if (!inputText.trim()) return

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputText,
      isUser: true,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, newMessage])
    setInputText("")

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: "ご質問ありがとうございます。デザインの改善について具体的にお手伝いできることがあれば教えてください。",
        isUser: false,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, aiResponse])
    }, 1000)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className={`h-full flex flex-col ${isMinimized ? "transition-all duration-300" : ""}`}>
      <div className="p-3 border-b flex items-center justify-between bg-gray-50">
        <h3 className="font-medium text-gray-800 text-sm">Chat AI</h3>
        <div className="flex items-center space-x-1">
          <Button variant="ghost" size="icon" onClick={onToggleMinimize} className="w-6 h-6">
            {isMinimized ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose} className="w-6 h-6">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {!isMinimized && (
        <>
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-3">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.isUser ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] p-2.5 rounded-lg text-xs ${
                      message.isUser ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {message.text}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="p-3 border-t">
            <div className="flex space-x-2">
              <Input
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="メッセージを入力..."
                className="flex-1 text-xs h-8"
              />
              <Button onClick={handleSendMessage} size="sm" className="bg-green-600 hover:bg-green-700 h-8">
                <Send className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
