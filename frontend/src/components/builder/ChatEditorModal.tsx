import { useState, useRef, useEffect } from "react"
import { useChatEditMutation } from "@/store/api/resume-api"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { X, MessageSquare, Send } from "lucide-react"
import { useAppDispatch } from "@/store/hooks"
import { setResume } from "@/store/slices/resume-slice"
import type { Resume } from "@/store/slices/resume-slice"

interface ChatEditorModalProps {
  isOpen: boolean
  onClose: () => void
  resume: Resume
  jobDescription: string
}

interface Message {
  role: "user" | "assistant"
  content: string
}

export function ChatEditorModal({ isOpen, onClose, resume, jobDescription }: ChatEditorModalProps) {
  const dispatch = useAppDispatch()
  const [chatEdit, { isLoading }] = useChatEditMutation()
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hi! I'm your AI Resume Editor. What would you like to change? (e.g., 'Make my summary shorter', 'Emphasize my Python experience in the last job')" }
  ])
  const [input, setInput] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  if (!isOpen) return null

  const handleSend = async () => {
    if (!input.trim()) return
    const userMsg = input
    setInput("")
    setMessages(prev => [...prev, { role: "user", content: userMsg }])
    
    try {
      const res = await chatEdit({ 
        resume, 
        job_description: jobDescription, 
        messages, 
        user_message: userMsg 
      }).unwrap()
      
      setMessages(prev => [...prev, { role: "assistant", content: res.assistant_message }])
      dispatch(setResume(res.updated_resume))
    } catch (err) {
      console.error(err)
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I encountered an error while updating your resume. Please try again." }])
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/70 backdrop-blur-sm animate-fade-in">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="chat-editor-title"
        className="bg-card w-full max-w-lg rounded-3xl shadow-2xl border border-border/70 flex flex-col h-[75vh] max-h-[44rem] animate-slide-up overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 sm:px-6 py-4 border-b border-border/60 bg-muted/25">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 shrink-0 rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-500/25 flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-violet-500" />
            </div>
            <div className="min-w-0 leading-tight">
              <h2 id="chat-editor-title" className="text-lg font-bold">Chat Editor</h2>
              <p className="text-xs text-muted-foreground">Ask AI to modify your resume</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full shrink-0 text-muted-foreground hover:text-foreground"
            aria-label="Close chat editor"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Chat History */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-background/40">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-br-md shadow-md shadow-violet-500/20"
                    : "bg-card border border-border/70 text-foreground rounded-bl-md shadow-sm"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-2xl rounded-bl-md px-4 py-3 bg-card border border-border/70 shadow-sm flex items-center gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-500/70 animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-500/70 animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-500/70 animate-bounce [animation-delay:300ms]" />
                </div>
                Working on it...
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-border/60 bg-card rounded-b-3xl">
          <div className="flex gap-2 items-end">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              placeholder="Type your request here..."
              className="min-h-[50px] max-h-[120px] resize-none rounded-xl bg-background/70 border-border/60 focus:border-violet-500/60 focus-visible:ring-2 focus-visible:ring-violet-500/25"
              disabled={isLoading}
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="rounded-xl h-[50px] w-[50px] bg-gradient-to-br from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white shadow-lg shadow-violet-500/25 shrink-0"
              aria-label="Send message"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground text-center">
            Enter to send · Shift + Enter for a new line · AI updates your resume in place
          </p>
        </div>
      </div>
    </div>
  )
}
