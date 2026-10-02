import { useState } from "react"
import { useGenerateInterviewQuestionsMutation } from "@/store/api/resume-api"
import type { InterviewPlan, InterviewQuestion } from "@/store/api/resume-api"
import type { Resume } from "@/store/slices/resume-slice"
import { Button } from "@/components/ui/button"
import { X, MessageSquare, Copy, Check, RefreshCw, Lightbulb, AlertCircle } from "lucide-react"

interface InterviewModalProps {
  isOpen: boolean
  onClose: () => void
  resume: Resume
  jobDescription: string
}

const CATEGORIES: { id: InterviewQuestion["category"]; label: string }[] = [
  { id: "behavioral", label: "Behavioral" },
  { id: "technical", label: "Technical" },
  { id: "role_specific", label: "Role-specific" },
  { id: "gap_close", label: "Gap closers" },
]

const DIFFICULTY_STYLES: Record<string, string> = {
  easy: "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  medium: "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  hard: "border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400",
}

export function InterviewModal({ isOpen, onClose, resume, jobDescription }: InterviewModalProps) {
  const [generateQuestions, { isLoading }] = useGenerateInterviewQuestionsMutation()
  const [plan, setPlan] = useState<InterviewPlan | null>(null)
  const [copiedIdx, setCopiedIdx] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleGenerate = async () => {
    setError(null)
    try {
      const res = await generateQuestions({ resume, job_description: jobDescription, count: 10 }).unwrap()
      setPlan(res)
    } catch (err) {
      console.error(err)
      setError("Could not generate questions. Please try again.")
    }
  }

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopiedIdx(key)
    setTimeout(() => setCopiedIdx(null), 1500)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/70 backdrop-blur-sm animate-fade-in">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="interview-title"
        className="bg-card w-full max-w-3xl rounded-3xl shadow-2xl border border-border/70 flex flex-col overflow-hidden max-h-[90vh] animate-slide-up"
      >
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-primary/25 bg-primary/10">
              <MessageSquare className="h-4.5 w-4.5 text-primary" aria-hidden="true" />
            </span>
            <div>
              <h2 id="interview-title" className="text-base font-bold">Mock Interview</h2>
              <p className="text-xs text-muted-foreground">
                Questions built from your resume + this job description
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 custom-scrollbar">
          {error && (
            <p role="alert" className="mb-3 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-600 dark:text-rose-400">
              {error}
            </p>
          )}

          {!plan && !isLoading && (
            <div className="flex flex-col items-center gap-4 py-10 text-center">
              <p className="max-w-sm text-sm text-muted-foreground">
                Generate 10 tailored questions — behavioral, technical, role-specific, and
                gap-closing questions an interviewer is likely to ask you for this role.
              </p>
              <Button onClick={handleGenerate} className="rounded-full bg-primary px-6 text-primary-foreground shadow-sm hover:bg-primary/90">
                <MessageSquare className="mr-2 h-4 w-4" /> Generate questions
              </Button>
            </div>
          )}

          {isLoading && (
            <div className="space-y-3 py-4">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="rounded-2xl border border-border/50 bg-background/40 p-4">
                  <div className="skeleton h-3.5 w-3/4" />
                  <div className="skeleton mt-2.5 h-3 w-1/2" />
                </div>
              ))}
              <p className="text-center text-xs text-muted-foreground">Interviewer is thinking…</p>
            </div>
          )}

          {plan && (
            <div className="space-y-5">
              {plan.strategy_tips?.length > 0 && (
                <div className="rounded-2xl border border-primary/25 bg-primary/5 p-4">
                  <h3 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
                    <Lightbulb className="h-3.5 w-3.5" aria-hidden="true" /> Strategy
                  </h3>
                  <ul className="space-y-1">
                    {plan.strategy_tips.map((tip, i) => (
                      <li key={i} className="text-xs leading-snug text-foreground/80">› {tip}</li>
                    ))}
                  </ul>
                </div>
              )}

              {CATEGORIES.map((cat) => {
                const questions = plan.questions.filter((q) => q.category === cat.id)
                if (questions.length === 0) return null
                return (
                  <div key={cat.id}>
                    <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      {cat.label}
                      <span className="ml-1.5 font-medium normal-case tracking-normal">({questions.length})</span>
                    </h3>
                    <ul className="space-y-2.5">
                      {questions.map((q, qi) => {
                        const copyKey = `${cat.id}-${qi}`
                        return (
                          <li key={copyKey} className="group/q rounded-2xl border border-border/50 bg-background/40 p-3.5">
                            <div className="flex items-start justify-between gap-3">
                              <p className="min-w-0 text-sm font-medium leading-snug text-foreground/90">
                                {q.question}
                              </p>
                              <div className="flex shrink-0 items-center gap-1.5">
                                <span className={`rounded border px-1.5 py-px text-[10px] font-semibold uppercase ${DIFFICULTY_STYLES[q.difficulty] ?? DIFFICULTY_STYLES.medium}`}>
                                  {q.difficulty}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleCopy(q.question, copyKey)}
                                  aria-label="Copy question"
                                  className="rounded p-1 text-muted-foreground opacity-60 transition hover:bg-muted hover:text-foreground focus-visible:opacity-100"
                                >
                                  {copiedIdx === copyKey ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                                </button>
                              </div>
                            </div>
                            {q.why_asked && (
                              <p className="mt-1.5 text-xs text-muted-foreground">
                                <span className="font-semibold text-foreground/70">Probes:</span> {q.why_asked}
                              </p>
                            )}
                            {q.answer_hint && (
                              <p className="mt-1 flex gap-1.5 text-xs text-muted-foreground/90">
                                <Lightbulb className="mt-0.5 h-3 w-3 shrink-0 text-amber-500" aria-hidden="true" />
                                {q.answer_hint}
                              </p>
                            )}
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border/60 px-5 py-3.5">
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
            Answers are not scored — practise out loud.
          </p>
          <div className="flex gap-2">
            {plan && (
              <Button variant="outline" size="sm" onClick={handleGenerate} disabled={isLoading} className="rounded-full border-border/70">
                <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} /> Regenerate
              </Button>
            )}
            <Button size="sm" onClick={onClose} className="rounded-full bg-primary px-4 text-primary-foreground hover:bg-primary/90">
              Done
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
