import { useState } from "react"
import { useGenerateCoverLetterMutation } from "@/store/api/resume-api"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { X, Sparkles, Copy, Check, FileText } from "lucide-react"
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/70 backdrop-blur-sm animate-fade-in">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cover-letter-title"
        className="bg-card w-full max-w-3xl rounded-3xl shadow-2xl border border-border/70 flex flex-col overflow-hidden max-h-[90vh] animate-slide-up"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 sm:px-6 py-4 border-b border-border/60 bg-muted/25">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 shrink-0 rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-500/25 flex items-center justify-center">
              <FileText className="w-4 h-4 text-violet-500" />
            </div>
            <div className="min-w-0 leading-tight">
              <h2 id="cover-letter-title" className="text-lg font-bold truncate">AI Cover Letter</h2>
              <p className="text-xs text-muted-foreground">Tailored for your target job description</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full shrink-0 text-muted-foreground hover:text-foreground"
            aria-label="Close cover letter"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 flex-1 overflow-y-auto custom-scrollbar">
          {!coverLetterText ? (
            <div className="flex flex-col items-center justify-center min-h-[24rem] text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-500/25 flex items-center justify-center mb-4">
                <Sparkles className="w-8 h-8 text-violet-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Ready to generate?</h3>
              <p className="text-muted-foreground mb-6 max-w-md leading-relaxed">
                Our AI will analyze your entire resume and the target job description to write a
                highly persuasive, customized cover letter.
              </p>
              <Button
                size="lg"
                onClick={handleGenerate}
                disabled={isLoading}
                className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white rounded-full px-8 shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all"
              >
                {isLoading ? (
                  <><div className="w-4 h-4 mr-2 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Generating...</>
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
                className="min-h-[400px] bg-background/60 border-border/60 focus:border-violet-500/60 focus-visible:ring-2 focus-visible:ring-violet-500/25 rounded-2xl p-5 text-[15px] leading-relaxed resize-y custom-scrollbar"
              />
              <Button
                size="sm"
                variant="secondary"
                onClick={handleCopy}
                className="absolute top-4 right-4 bg-background/90 backdrop-blur-sm border border-border shadow-sm rounded-full h-8"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                {copied ? "Copied!" : "Copy"}
              </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        {coverLetterText && (
          <div className="px-5 sm:px-6 py-4 border-t border-border/60 bg-muted/25 flex flex-wrap justify-end gap-3">
            <Button variant="outline" onClick={() => setCoverLetterText("")} className="rounded-full border-border/70">
              Discard
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={isLoading}
              className="rounded-full px-6 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white shadow-lg shadow-violet-500/25"
            >
              {isLoading ? "Regenerating..." : "Regenerate"}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
