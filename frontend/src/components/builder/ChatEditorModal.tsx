import { useState, useRef, useEffect } from "react"
import { useChatEditMutation } from "@/store/api/resume-api"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { X, MessageSquare, Sparkles, Send } from "lucide-react"
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-card w-full max-w-lg rounded-3xl shadow-2xl border border-border flex flex-col h-[70vh] animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 bg-muted/20 rounded-t-3xl">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center border border-violet-500/30">
              <MessageSquare className="w-4 h-4 text-violet-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Chat Editor</h2>
              <p className="text-xs text-muted-foreground">Ask AI to modify your resume</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Chat History */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${msg.role === "user" ? "bg-violet-600 text-white" : "bg-muted/50 border border-border/50 text-foreground"}`}>
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-2xl px-4 py-3 text-sm bg-muted/50 border border-border/50 text-foreground flex items-center gap-2">
                <div className="w-3 h-3 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
                Working on it...
              </div>
            </div>
          )}
        </div>
        
        {/* Input Area */}
        <div className="p-4 border-t border-border/50 bg-background rounded-b-3xl flex gap-2 items-end">
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
            className="min-h-[50px] max-h-[120px] resize-none rounded-xl"
            disabled={isLoading}
          />
          <Button 
            size="icon" 
            onClick={handleSend} 
            disabled={isLoading || !input.trim()}
            className="rounded-xl h-[50px] w-[50px] bg-violet-600 hover:bg-violet-700 text-white shrink-0"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
