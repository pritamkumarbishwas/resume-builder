import { useState } from "react"
import { useGenerateCoverLetterMutation } from "@/store/api/resume-api"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { X, Sparkles, Copy, Check } from "lucide-react"
import type { Resume } from "@/store/slices/resume-slice"

interface CoverLetterModalProps {
  isOpen: boolean
  onClose: () => void
  resume: Resume
  jobDescription: string
}

export function CoverLetterModal({ isOpen, onClose, resume, jobDescription }: CoverLetterModalProps) {
  const [generateCoverLetter, { isLoading }] = useGenerateCoverLetterMutation()
  const [coverLetterText, setCoverLetterText] = useState("")
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  const handleGenerate = async () => {
    try {
      const res = await generateCoverLetter({ resume, job_description: jobDescription }).unwrap()
      setCoverLetterText(res.cover_letter)
    } catch (err) {
      console.error("Failed to generate cover letter:", err)
      alert("Failed to generate cover letter. Check console for details.")
    }
  }

  const handleCopy = () => {
    if (!coverLetterText) return
    navigator.clipboard.writeText(coverLetterText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-card w-full max-w-3xl rounded-3xl shadow-2xl border border-border flex flex-col overflow-hidden max-h-[90vh] animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 bg-muted/20">
          <div>
            <h2 className="text-xl font-bold">AI Cover Letter</h2>
            <p className="text-xs text-muted-foreground">Tailored for your target job description</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto">
          {!coverLetterText ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="w-16 h-16 bg-fuchsia-500/20 rounded-full flex items-center justify-center mb-4">
                <Sparkles className="w-8 h-8 text-fuchsia-500" />
              </div>
              <h3 className="text-lg font-medium mb-2">Ready to generate?</h3>
              <p className="text-muted-foreground mb-6 max-w-md">
                Our AI will analyze your entire resume and the target job description to write a highly persuasive, customized cover letter.
              </p>
              <Button 
                size="lg" 
                onClick={handleGenerate} 
                disabled={isLoading}
                className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white rounded-full px-8 shadow-lg shadow-fuchsia-500/25 transition-all"
              >
                {isLoading ? (
                  <><div className="w-4 h-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating...</>
                ) : (
                  <><Sparkles className="w-4 h-4 mr-2" /> Generate Cover Letter</>
                )}
              </Button>
            </div>
          ) : (
            <div className="relative">
              <Textarea
                value={coverLetterText}
                onChange={(e) => setCoverLetterText(e.target.value)}
                className="min-h-[400px] bg-background/50 border-border/50 focus:border-violet-500/50 rounded-xl p-5 text-base leading-relaxed resize-y custom-scrollbar"
              />
              <Button
                size="sm"
                variant="secondary"
                onClick={handleCopy}
                className="absolute top-4 right-4 bg-background/80 backdrop-blur-sm border border-border shadow-sm rounded-full"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                {copied ? "Copied!" : "Copy"}
              </Button>
            </div>
          )}
        </div>
        
        {/* Footer */}
        {coverLetterText && (
          <div className="px-6 py-4 border-t border-border/50 bg-muted/20 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setCoverLetterText("")} className="rounded-full">
              Discard
            </Button>
            <Button 
              onClick={handleGenerate} 
              disabled={isLoading}
              className="bg-violet-600 hover:bg-violet-700 text-white rounded-full px-6"
            >
              {isLoading ? "Regenerating..." : "Regenerate"}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
