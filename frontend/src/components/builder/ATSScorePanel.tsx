interface ATSScorePanelProps {
  score: number
  updating?: boolean
}

const scoreTone = (s: number) => {
  if (s >= 80) {
    return {
      ring: "text-emerald-600 dark:text-emerald-400",
      badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      label: "Excellent match",
    }
  }
  if (s >= 60) {
    return {
      ring: "text-amber-600 dark:text-amber-400",
      badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
      label: "Good — room to improve",
    }
  }
  return {
    ring: "text-rose-600 dark:text-rose-400",
    badge: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    label: "Needs work",
  }
}

export function ATSScorePanel({ score, updating = false }: ATSScorePanelProps) {
  const tone = scoreTone(score)

  return (
    <section
      aria-label="ATS match score"
      className="rounded-2xl border border-border/60 bg-card shadow-sm p-5 sm:p-6"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-bold tracking-tight">ATS Match Score</h3>
            {updating && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/70 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                <span
                  className="h-3 w-3 animate-spin rounded-full border-2 border-primary/40 border-t-primary"
                  aria-hidden="true"
                />
                Updating…
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Compared against your target job description
          </p>
          <span
            className={`mt-3 inline-block rounded-full border px-2.5 py-1 text-xs font-semibold ${tone.badge}`}
          >
            {tone.label}
          </span>
        </div>

        <div className="relative h-32 w-32 shrink-0 sm:h-36 sm:w-36">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36" aria-hidden="true">
            <path
              className="text-muted"
              strokeWidth="2.5"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className={`${tone.ring} transition-all duration-1000 ease-out`}
              strokeDasharray={`${score}, 100`}
              strokeWidth="2.5"
              strokeLinecap="round"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <div
            className={`absolute inset-0 flex flex-col items-center justify-center ${tone.ring}`}
            role="img"
            aria-label={`ATS match score: ${score} percent`}
          >
            <span className="text-4xl font-extrabold leading-none tabular-nums">{score}%</span>
            <span className="mt-1 text-[10px] font-semibold uppercase tracking-wider opacity-80">ATS</span>
          </div>
        </div>
      </div>
    </section>
  )
}
