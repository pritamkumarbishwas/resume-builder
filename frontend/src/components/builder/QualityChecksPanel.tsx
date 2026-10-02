import { AlertCircle, CheckCircle2, XCircle, ShieldCheck, Lightbulb } from "lucide-react"
import type { ReviewReport, QualityCheck } from "@/store/api/resume-api"

interface QualityChecksPanelProps {
  review: ReviewReport | null
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

export function QualityChecksPanel({ review, updating = false }: QualityChecksPanelProps) {
  if (!review) return null

  const checks = review.checks ?? []
  const counts = checks.reduce(
    (acc, c) => {
      acc[c.status] += 1
      return acc
    },
    { pass: 0, warn: 0, fail: 0 },
  )

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

      {/* Status tally */}
      <div className="mb-3 flex gap-1.5">
        <span className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLES.pass.chip} ${STATUS_STYLES.pass.text}`}>
          <CheckCircle2 className="h-3 w-3" aria-hidden="true" /> {counts.pass} pass
        </span>
        <span className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLES.warn.chip} ${STATUS_STYLES.warn.text}`}>
          <AlertCircle className="h-3 w-3" aria-hidden="true" /> {counts.warn} warn
        </span>
        <span className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLES.fail.chip} ${STATUS_STYLES.fail.text}`}>
          <XCircle className="h-3 w-3" aria-hidden="true" /> {counts.fail} fail
        </span>
      </div>

      {/* Checks */}
      {checks.length > 0 ? (
        <ul className="space-y-2">
          {checks.map((check, i) => {
            const s = STATUS_STYLES[check.status]
            const Icon = s.icon
            return (
              <li key={i} className="rounded-xl border border-border/50 bg-background/40 p-2.5">
                <div className="flex items-center gap-1.5">
                  <Icon className={`h-3.5 w-3.5 shrink-0 ${s.text}`} aria-hidden="true" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {CATEGORY_LABELS[check.category]}
                  </span>
                  <span className="text-[11px] text-muted-foreground/70">· {check.target}</span>
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
