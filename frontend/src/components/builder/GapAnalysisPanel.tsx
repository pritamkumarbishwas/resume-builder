import { CheckCircle2, AlertCircle, XCircle, Target, Plus, Check } from "lucide-react"
import { includesTerm } from "@/lib/utils"

interface SkillMatch {
  skill: string
  present: boolean
  evidence?: string
}

interface GapAnalysisPanelProps {
  overallMatchPercent: number
  matchedSkills: SkillMatch[]
  missingRequired: string[]
  missingPreferred: string[]
  relevantExperiences: string[]
  recommendations: string[]
  skills?: string[]
  onAddKeyword?: (keyword: string) => void
  updating?: boolean
}

function MissingChip({
  keyword,
  added,
  onAdd,
  tone,
}: {
  keyword: string
  added: boolean
  onAdd?: (keyword: string) => void
  tone: "rose" | "amber"
}) {
  if (added) {
    return (
      <span
        title="Already in your skills"
        className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400"
      >
        <Check className="h-3 w-3" aria-hidden="true" />
        {keyword}
      </span>
    )
  }

  const palette =
    tone === "rose"
      ? "border-rose-500/20 bg-rose-500/10 text-rose-600 hover:border-rose-500/50 hover:bg-rose-500/15 dark:text-rose-400"
      : "border-amber-500/20 bg-amber-500/10 text-amber-600 hover:border-amber-500/50 hover:bg-amber-500/15 dark:text-amber-400"

  if (!onAdd) {
    return (
      <span className={`inline-flex items-center rounded-lg border px-2 py-1 text-xs font-medium ${palette}`}>
        {keyword}
      </span>
    )
  }

  return (
    <button
      type="button"
      onClick={() => onAdd(keyword)}
      title={`Add "${keyword}" to your skills`}
      className={`group/kw inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 ${palette}`}
    >
      {keyword}
      <Plus className="h-3 w-3 opacity-50 transition-opacity group-hover/kw:opacity-100" aria-hidden="true" />
    </button>
  )
}

export function GapAnalysisPanel({
  overallMatchPercent,
  matchedSkills,
  missingRequired,
  missingPreferred,
  recommendations,
  skills = [],
  onAddKeyword,
  updating = false,
}: GapAnalysisPanelProps) {
  const matchPercent = Math.max(0, Math.min(100, overallMatchPercent))

  return (
    <section
      aria-label="Skill gap analysis"
      className="rounded-2xl border border-border/60 bg-card shadow-sm p-5"
    >
      <div className="mb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-primary/25 bg-primary/10">
              <Target className="h-4 w-4 text-primary" aria-hidden="true" />
            </span>
            <div className="min-w-0 leading-tight">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-bold tracking-tight">Skill Gap Analysis</h3>
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
              <p className="mt-0.5 text-xs text-muted-foreground">Deep dive into missing requirements</p>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <div className="text-2xl font-extrabold leading-none tabular-nums text-primary">
              {matchPercent}%
            </div>
            <div className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Match
            </div>
          </div>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted" aria-hidden="true">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-700"
            style={{ width: `${matchPercent}%` }}
          />
        </div>
      </div>

      <div className="space-y-4 pt-1">
        {/* Missing Required Skills */}
        {missingRequired.length > 0 && (
          <div className="space-y-2">
            <div>
              <h4 className="flex items-center text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                <XCircle className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" /> Missing Required
                <span className="ml-1.5 rounded-full bg-rose-500/10 px-1.5 py-px text-[10px] font-bold text-rose-600 dark:text-rose-400">
                  {missingRequired.filter((kw) => !includesTerm(skills, kw)).length}
                </span>
              </h4>
              {onAddKeyword && (
                <p className="mt-1 text-[11px] text-muted-foreground">Click a skill to add it to your Skills</p>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {missingRequired.map((kw, i) => (
                <MissingChip
                  key={i}
                  keyword={kw}
                  added={includesTerm(skills, kw)}
                  onAdd={onAddKeyword}
                  tone="rose"
                />
              ))}
            </div>
          </div>
        )}

        {/* Missing Preferred Skills */}
        {missingPreferred.length > 0 && (
          <div className="space-y-2">
            <h4 className="flex items-center text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              <AlertCircle className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" /> Missing Preferred
              <span className="ml-1.5 rounded-full bg-amber-500/10 px-1.5 py-px text-[10px] font-bold text-amber-600 dark:text-amber-400">
                {missingPreferred.filter((kw) => !includesTerm(skills, kw)).length}
              </span>
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {missingPreferred.map((kw, i) => (
                <MissingChip
                  key={i}
                  keyword={kw}
                  added={includesTerm(skills, kw)}
                  onAdd={onAddKeyword}
                  tone="amber"
                />
              ))}
            </div>
          </div>
        )}

        {/* Matched Skills */}
        {matchedSkills.length > 0 && (
          <div className="space-y-2">
            <h4 className="flex items-center text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" /> Verified Skills
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {matchedSkills
                .filter((s) => s.present)
                .map((s, i) => (
                  <div
                    key={i}
                    className="group relative rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400"
                  >
                    {s.skill}
                    {s.evidence && (
                      <div className="absolute bottom-full left-1/2 z-50 mb-1.5 hidden w-52 -translate-x-1/2 rounded-lg border border-border bg-popover p-2.5 text-left text-[11px] leading-snug text-popover-foreground shadow-xl group-hover:block">
                        “{s.evidence}”
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Actionable Recommendations */}
        {recommendations.length > 0 && (
          <div className="space-y-2 border-t border-border/60 pt-4">
            <h4 className="mb-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Action Plan
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

        {missingRequired.length === 0 && missingPreferred.length === 0 && matchedSkills.length === 0 && (
          <p className="rounded-xl border border-dashed border-border/70 px-3 py-6 text-center text-sm text-muted-foreground">
            Run the analysis against a target job description to see your skill gaps.
          </p>
        )}
      </div>
    </section>
  )
}
