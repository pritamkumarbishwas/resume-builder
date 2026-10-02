import { useState } from "react"
import { AlertCircle, CheckCircle2, XCircle, ShieldCheck, Lightbulb, Sparkles, Check, Loader2 } from "lucide-react"
import { useAppSelector } from "@/store/hooks"
import { useChatEditMutation } from "@/store/api/resume-api"
import type { ReviewReport, QualityCheck } from "@/store/api/resume-api"
import { setResume } from "@/store/slices/resume-slice"
import type { Resume } from "@/store/slices/resume-slice"
import { useAppDispatch } from "@/store/hooks"

interface QualityChecksPanelProps {
  review: ReviewReport | null
  resume: Resume
  jobDescription: string
  updating?: boolean
}

const CATEGORY_LABELS: Record<QualityCheck["category"], string> = {
  grammar: "Grammar",
  tone: "Tone",
  length: "Length",
}

const STATUS_STYLES: Record<QualityCheck["status"], { icon: typeof CheckCircle2; text: string; chip: string }> = {
  pass: {
    icon: CheckCircle2,
    text: "text-emerald-600 dark:text-emerald-400",
    chip: "border-emerald-500/20 bg-emerald-500/10",
  },
  warn: {
    icon: AlertCircle,
    text: "text-amber-600 dark:text-amber-400",
    chip: "border-amber-500/20 bg-amber-500/10",
  },
  fail: {
    icon: XCircle,
    text: "text-rose-600 dark:text-rose-400",
    chip: "border-rose-500/20 bg-rose-500/10",
  },
}

const SEVERITY_STYLES: Record<string, string> = {
  high: "border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400",
  medium: "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  low: "border-border/60 bg-muted/50 text-muted-foreground",
}

const checkKey = (c: QualityCheck, i: number) => `${c.category}:${c.target}:${i}`

export function QualityChecksPanel({ review, resume, jobDescription, updating = false }: QualityChecksPanelProps) {
  const dispatch = useAppDispatch()
  const template = useAppSelector((state) => state.resume.template)
  const [chatEdit, { isLoading: isFixing }] = useChatEditMutation()

  // State is tagged with the review object it belongs to: when the auto-pipeline
  // delivers a fresh review, marks/spinners reset without needing an effect.
  const [pending, setPending] = useState<{ review: ReviewReport; key: string } | null>(null)
  const [fixedState, setFixedState] = useState<{ review: ReviewReport; keys: string[] } | null>(null)
  const [errorState, setErrorState] = useState<{ review: ReviewReport; msg: string } | null>(null)

  if (!review) return null

  const pendingKey = pending && pending.review === review ? pending.key : null
  const fixedKeys = fixedState && fixedState.review === review ? fixedState.keys : []
  const errorMsg = errorState && errorState.review === review ? errorState.msg : null

  const checks = review.checks ?? []
  const fixable = checks.filter((c) => c.status !== "pass")
  const counts = checks.reduce(
    (acc, c) => {
      acc[c.status] += 1
      return acc
    },
    { pass: 0, warn: 0, fail: 0 },
  )

  const applyFix = async (message: string, key: string) => {
    setErrorState(null)
    setPending({ review, key })
    try {
      const res = await chatEdit({
        resume,
        job_description: jobDescription,
        messages: [],
        user_message: message,
        template,
      }).unwrap()
      dispatch(setResume(res.updated_resume))
      // The auto-pipeline re-scores the resume; marks stay visible until the
      // fresh review arrives (then they reset via the review-identity check).
      setFixedState((prev) => ({
        review,
        keys: key === "__all__" ? checks.map((c, i) => checkKey(c, i)) : [...(prev && prev.review === review ? prev.keys : []), key],
      }))
    } catch (err) {
      console.error("Fix failed:", err)
      setErrorState({ review, msg: "Could not apply the fix. Please try again." })
    } finally {
      setPending(null)
    }
  }

  const handleFixOne = (check: QualityCheck, key: string) =>
    applyFix(
      `Apply this single resume quality fix and change nothing else.\n` +
        `Section/target: "${check.target}"\n` +
        `Category: ${check.category}\n` +
        `Problem and required change: ${check.detail}\n` +
        `Keep every other word of the resume identical.`,
      key,
    )

  const handleFixAll = () =>
    applyFix(
      `Apply all of the following resume quality fixes, and nothing else. ` +
        `Keep every part of the resume that is not listed below identical:\n` +
        fixable.map((c) => `- [${c.category}] ${c.target}: ${c.detail}`).join("\n"),
      "__all__",
    )

  const isPending = (key: string) => pendingKey === key

  return (
    <section
      aria-label="Grammar, tone and length checks"
      className="rounded-2xl border border-border/60 bg-card shadow-sm p-5"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-primary/25 bg-primary/10">
            <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
          </span>
          <div className="min-w-0 leading-tight">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold tracking-tight">Quality Checks</h3>
              {updating && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/70 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-primary/40 border-t-primary" />
                  checking
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">Grammar · tone · length</p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end">
          <span className="text-lg font-extrabold leading-none">{review.overall_quality_score}</span>
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">quality score</span>
        </div>
      </div>

      {/* Status tally + fix-all */}
      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        <span className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLES.pass.chip} ${STATUS_STYLES.pass.text}`}>
          <CheckCircle2 className="h-3 w-3" aria-hidden="true" /> {counts.pass} pass
        </span>
        <span className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLES.warn.chip} ${STATUS_STYLES.warn.text}`}>
          <AlertCircle className="h-3 w-3" aria-hidden="true" /> {counts.warn} warn
        </span>
        <span className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLES.fail.chip} ${STATUS_STYLES.fail.text}`}>
          <XCircle className="h-3 w-3" aria-hidden="true" /> {counts.fail} fail
        </span>
        {fixable.length > 0 && (
          <button
            type="button"
            onClick={handleFixAll}
            disabled={isFixing}
            className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary transition-colors hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending("__all__") ? (
              <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
            ) : (
              <Sparkles className="h-3 w-3" aria-hidden="true" />
            )}
            {isPending("__all__") ? "Fixing…" : `Fix all (${fixable.length})`}
          </button>
        )}
      </div>

      {errorMsg && (
        <p role="alert" className="mb-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-600 dark:text-rose-400">
          {errorMsg}
        </p>
      )}

      {/* Checks */}
      {checks.length > 0 ? (
        <ul className="space-y-2">
          {checks.map((check, i) => {
            const s = STATUS_STYLES[check.status]
            const Icon = s.icon
            const key = checkKey(check, i)
            const isFixed = fixedKeys.includes(key)
            const pendingHere = isPending(key)
            return (
              <li key={key} className="rounded-xl border border-border/50 bg-background/40 p-2.5">
                <div className="flex items-center gap-1.5">
                  <Icon className={`h-3.5 w-3.5 shrink-0 ${s.text}`} aria-hidden="true" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {CATEGORY_LABELS[check.category]}
                  </span>
                  <span className="text-[11px] text-muted-foreground/70">· {check.target}</span>
                  {check.status !== "pass" && (
                    <span className="ml-auto">
                      {isFixed ? (
                        <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                          <Check className="h-3 w-3" aria-hidden="true" /> Fixed · rescoring
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleFixOne(check, key)}
                          disabled={isFixing}
                          className="inline-flex items-center gap-1 rounded-lg border border-primary/40 bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary transition-colors hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {pendingHere ? (
                            <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                          ) : (
                            <Sparkles className="h-3 w-3" aria-hidden="true" />
                          )}
                          {pendingHere ? "Fixing…" : "Apply fix"}
                        </button>
                      )}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs leading-snug text-foreground/80">{check.detail}</p>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="rounded-xl border border-dashed border-border/60 p-3 text-xs text-muted-foreground">
          No individual checks were returned for this run.
        </p>
      )}

      {/* Summary feedback */}
      {review.summary_feedback && (
        <p className="mt-3 rounded-xl border border-border/50 bg-muted/30 p-2.5 text-xs leading-snug text-foreground/80">
          {review.summary_feedback}
        </p>
      )}

      {/* Suggested fixes */}
      {review.bullet_feedback?.length > 0 && (
        <div className="mt-3">
          <h4 className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Suggested fixes
          </h4>
          <ul className="space-y-1.5">
            {review.bullet_feedback.slice(0, 4).map((fb, i) => (
              <li key={i} className="rounded-lg border border-border/50 bg-background/40 p-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="min-w-0 text-xs font-medium text-foreground/85 line-clamp-2">"{fb.original}"</p>
                  <span className={`shrink-0 rounded border px-1.5 py-px text-[10px] font-semibold uppercase ${SEVERITY_STYLES[fb.severity] ?? SEVERITY_STYLES.low}`}>
                    {fb.severity}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{fb.suggestion}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Tips */}
      {review.general_tips?.length > 0 && (
        <div className="mt-3">
          <h4 className="mb-1.5 flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            <Lightbulb className="h-3 w-3" aria-hidden="true" /> Tips
          </h4>
          <ul className="space-y-1">
            {review.general_tips.slice(0, 4).map((tip, i) => (
              <li key={i} className="flex gap-1.5 text-xs leading-snug text-muted-foreground">
                <span className="text-primary" aria-hidden="true">›</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
