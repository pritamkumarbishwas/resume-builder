import { useEffect, useRef } from "react"
import { Code, PenLine, Lightbulb, BarChart3 } from "lucide-react"
import { ChatMessage } from "./chat-message"
import { ChatInput } from "./chat-input"
import { ThinkingIndicator } from "./thinking-indicator"
import type { Conversation } from "@/types/chat"

interface ChatAreaProps {
  conversation: Conversation | null
  onSend: (message: string) => void
  onRetry?: (conversationId: string, messageId: string) => void
  isLoading?: boolean
}

const SUGGESTIONS = [
  { icon: Code, label: "Code", text: "Write a Python function to sort a list" },
  { icon: PenLine, label: "Write", text: "Help me write a professional email" },
  { icon: Lightbulb, label: "Explain", text: "Explain how neural networks work" },
  { icon: BarChart3, label: "Analyze", text: "Analyze this data and find trends" },
] as const

export function ChatArea({ conversation, onSend, onRetry, isLoading }: ChatAreaProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [conversation?.messages, isLoading])

  const messages = conversation?.messages ?? []
  const isEmpty = messages.length === 0 && !isLoading

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="mb-8">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-end mx-auto mb-5">
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7 text-primary-foreground">
                  <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729z" />
                </svg>
              </div>
              <h1 className="text-3xl font-semibold text-foreground mb-2">
                What can I help with?
              </h1>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 max-w-2xl w-full">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion.label}
                  onClick={() => onSend(suggestion.text)}
                  className="flex items-center gap-3 text-left p-4 rounded-xl border border-border bg-card hover:bg-card-hover transition-colors"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <suggestion.icon className="h-4.5 w-4.5 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-foreground">{suggestion.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{suggestion.text}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="py-2">
            {messages.map((msg, i) => (
              <ChatMessage
                key={msg.id}
                message={msg}
                isLast={i === messages.length - 1}
                isStreaming={isLoading && i === messages.length - 1 && msg.role === "assistant"}
                onRetry={
                  onRetry && msg.role === "assistant" && msg.content
                    ? () => onRetry(conversation!.id, msg.id)
                    : undefined
                }
              />
            ))}
            {isLoading && <ThinkingIndicator />}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <ChatInput onSend={onSend} disabled={isLoading} />
    </div>
  )
}
