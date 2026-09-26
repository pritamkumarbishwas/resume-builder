import { useState } from "react"
import { useAppDispatch } from "@/store/hooks"
import { setJobDescription, setStep } from "@/store/slices/resume-slice"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Briefcase, ArrowRight, ArrowLeft, Check } from "lucide-react"

const STEPS = ["Upload Profile", "Set Target Role", "Optimize & Export"]

export function JobDescriptionView() {
  const dispatch = useAppDispatch()
  const [jd, setJd] = useState("")

  const handleNext = () => {
    if (!jd.trim()) return
    dispatch(setJobDescription(jd))
    dispatch(setStep("TAILOR"))
  }

  const handleBack = () => {
    dispatch(setStep("UPLOAD"))
  }

  const wordCount = jd.trim() ? jd.trim().split(/\s+/).length : 0

  return (
    <div className="w-full max-w-3xl mx-auto pt-8 pb-16 animate-fade-in">
      <div className="text-center mb-6">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-fuchsia-500/25 bg-fuchsia-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-fuchsia-600 dark:text-fuchsia-300">
          Step 2 of 3
        </span>
        <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold tracking-tight mb-3 bg-gradient-to-r from-violet-600 via-violet-500 to-fuchsia-500 text-transparent bg-clip-text">
          Define Your Target Role
        </h2>
        <p className="text-muted-foreground max-w-xl mx-auto leading-relaxed">
          Paste the job description of your dream role. Our AI will analyze the key requirements
          to align your experience perfectly.
        </p>
      </div>

      <div className="bg-card/70 backdrop-blur-xl border border-border/70 shadow-xl rounded-3xl p-5 sm:p-6 flex flex-col relative overflow-hidden">
        {/* Decorative background blur */}
        <div
          className="absolute -top-40 -right-40 w-96 h-96 bg-fuchsia-500/10 blur-3xl rounded-full pointer-events-none"
          aria-hidden="true"
        />

        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-500/25 rounded-xl flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-violet-500" />
            </div>
            <div className="leading-tight">
              <h3 className="font-semibold text-base sm:text-lg">Job Details</h3>
              <p className="text-xs text-muted-foreground">Responsibilities, must-haves, nice-to-haves</p>
            </div>
          </div>
          <span className="hidden sm:inline-flex shrink-0 rounded-full border border-border/60 bg-background/60 px-2.5 py-1 text-xs font-medium text-muted-foreground">
            {wordCount} {wordCount === 1 ? "word" : "words"}
          </span>
        </div>

        <Textarea
          value={jd}
          onChange={(e) => setJd(e.target.value)}
          placeholder="Paste the complete job description here..."
          className="flex-1 min-h-[280px] resize-y bg-background/60 border-border/60 hover:border-border focus:border-violet-500/60 focus-visible:ring-2 focus-visible:ring-violet-500/25 rounded-2xl p-5 text-[15px] leading-relaxed shadow-inner transition-colors"
        />

        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="text-muted-foreground hover:text-foreground rounded-full"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <Button
            size="lg"
            onClick={handleNext}
            disabled={!jd.trim()}
            className="rounded-full px-8 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all"
          >
            Analyze &amp; Optimize <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>

      {/* Progress strip */}
      <div className="relative mt-10">
        <div className="absolute left-[16.66%] right-[16.66%] top-5 h-px bg-border" aria-hidden="true" />
        <ol className="relative grid grid-cols-3 gap-2 text-center text-xs sm:text-sm">
          {STEPS.map((label, i) => {
            const isDone = i === 0
            const isActive = i === 1
            return (
              <li key={label} className="flex flex-col items-center gap-2">
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold ${
                    isActive
                      ? "border-transparent bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-md shadow-violet-500/30"
                      : isDone
                        ? "border-violet-500/40 bg-violet-500/10 text-violet-600 dark:text-violet-300"
                        : "border-border bg-card text-muted-foreground"
                  }`}
                >
                  {isDone ? <Check className="w-4 h-4" /> : i + 1}
                </span>
                <span
                  className={
                    isActive ? "font-semibold text-foreground" : isDone ? "text-foreground/70" : "text-muted-foreground"
                  }
                >
                  {label}
                </span>
              </li>
            )
          })}
        </ol>
      </div>
    </div>
  )
}
