import { Check, Plus, Lightbulb } from "lucide-react"
import { includesTerm } from "@/lib/utils"
import type { ScoreBreakdown } from "@/lib/score-breakdown"

interface ScoreBreakdownCardProps {
  breakdown: ScoreBreakdown
  matchingKeywords: string[]
  missingKeywords: string[]
  skills: string[]
  recommendations: string[]
  onAddKeyword?: (keyword: string) => void
}

function MetricRow({
  label,
  value,
  hint,
}: {
  label: string
  value: number | null
  hint?: string
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-[13px] font-semibold text-foreground">{label}</span>
        <span className="text-[13px] font-bold tabular-nums text-foreground">
          {value === null ? "—" : `${value}%`}
        </span>
      </div>
      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-[width] duration-500 ${value === null ? "bg-border" : "bg-primary"}`}
          style={{ width: `${value ?? 0}%` }}
          aria-hidden="true"
        />
      </div>
      {hint && <p className="mt-1.5 text-xs leading-snug text-muted-foreground">{hint}</p>}
    </div>
  )
}

export function ScoreBreakdownCard({
  breakdown,
  matchingKeywords,
  missingKeywords,
  skills,
  recommendations,
  onAddKeyword,
}: ScoreBreakdownCardProps) {
  const formattingHint = breakdown.formattingHints[0]

  return (
    <section
      aria-label="Score breakdown"
      className="rounded-2xl border border-border/60 bg-card shadow-sm p-5"
    >
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-bold tracking-tight">Score Breakdown</h3>
        <span className="text-[11px] font-medium text-muted-foreground">Derived from your resume</span>
      </div>

      <div className="space-y-4">
        <MetricRow
          label="Keyword Match"
          value={breakdown.keywordMatch}
          hint={
            breakdown.keywordMatch === null
              ? "No job description keywords to compare yet"
              : `${matchingKeywords.length} matched · ${missingKeywords.length} missing`
          }
        />
        <MetricRow label="Formatting" value={breakdown.formatting} hint={formattingHint} />
        <MetricRow label="Quantified Impact" value={breakdown.quantifiedImpact} hint={breakdown.quantifiedHint} />
      </div>

      {missingKeywords.length > 0 && (
        <div className="mt-5 border-t border-border/60 pt-4">
          <h4 className="mb-1.5 flex items-center text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
            Missing Keywords
            <span className="ml-1.5 rounded-full bg-rose-500/10 px-1.5 py-px text-[10px] font-bold text-rose-600 dark:text-rose-400">
              {missingKeywords.filter((kw) => !includesTerm(skills, kw)).length}
            </span>
          </h4>
          {onAddKeyword && (
            <p className="mb-2 text-[11px] text-muted-foreground">Click a keyword to add it to Skills</p>
          )}
          <div className="flex flex-wrap gap-1.5">
            {missingKeywords.map((kw, i) => {
              const added = includesTerm(skills, kw)
              if (added) {
                return (
                  <span
                    key={i}
                    title="Already in your skills"
                    className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400"
                  >
                    <Check className="h-3 w-3" aria-hidden="true" />
                    {kw}
                  </span>
                )
              }
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => onAddKeyword?.(kw)}
                  title={`Add "${kw}" to your skills`}
                  className="group/kw inline-flex items-center gap-1 rounded-lg border border-rose-500/20 bg-rose-500/10 px-2 py-1 text-xs font-medium text-rose-600 transition-colors hover:border-rose-500/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 dark:text-rose-400"
                >
                  {kw}
                  <Plus className="h-3 w-3 opacity-50 transition-opacity group-hover/kw:opacity-100" aria-hidden="true" />
                </button>
              )
            })}
          </div>
        </div>
      )}

      {matchingKeywords.length > 0 && (
        <div className="mt-4 border-t border-border/60 pt-4">
          <h4 className="mb-2 flex items-center text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Matching Keywords
            <span className="ml-1.5 rounded-full bg-emerald-500/10 px-1.5 py-px text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
              {matchingKeywords.length}
            </span>
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {matchingKeywords.map((kw, i) => (
              <span
                key={i}
                className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400"
              >
                {kw}
              </span>
            ))}
          </div>
        </div>
      )}

      {recommendations.length > 0 && (
        <div className="mt-4 border-t border-border/60 pt-4">
          <h4 className="mb-2 flex items-center text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            <Lightbulb className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" /> AI Recommendations
          </h4>
          <ul className="space-y-2">
            {recommendations.map((rec, i) => (
              <li key={i} className="flex items-start text-[13px] leading-relaxed text-foreground/85">
                <span className="mr-2.5 mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/70" aria-hidden="true" />
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
