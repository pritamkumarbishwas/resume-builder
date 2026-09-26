import { CheckCircle2, AlertCircle, XCircle, Target } from "lucide-react"

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
}

export function GapAnalysisPanel({
  overallMatchPercent,
  matchedSkills,
  missingRequired,
  missingPreferred,
  recommendations,
}: GapAnalysisPanelProps) {
  return (
    <div className="bg-card/60 backdrop-blur-xl border border-border/70 shadow-xl rounded-2xl p-5 sm:p-6 flex flex-col relative overflow-hidden h-full">
      <div className="mb-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-violet-500/15 border border-violet-500/25 flex items-center justify-center">
                <Target className="w-4 h-4 text-violet-500" />
              </div>
              <div className="leading-tight">
                <h3 className="text-lg font-bold tracking-tight">Gap Analysis</h3>
                <p className="text-xs text-muted-foreground">Deep dive into missing requirements</p>
              </div>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-2xl font-extrabold text-violet-600 dark:text-violet-300 leading-none">
              {overallMatchPercent}%
            </div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mt-1">Match</div>
          </div>
        </div>
        <div className="mt-3 h-2 w-full rounded-full bg-muted overflow-hidden" aria-hidden="true">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 transition-all duration-700"
            style={{ width: `${Math.max(0, Math.min(100, overallMatchPercent))}%` }}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-5 pr-1">
        {/* Missing Required Skills */}
        {missingRequired.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-xs uppercase tracking-wider flex items-center text-rose-500">
              <XCircle className="w-3.5 h-3.5 mr-1.5" /> Missing Required Skills
              <span className="ml-1.5 rounded-full bg-rose-500/10 px-1.5 py-px text-[10px] font-bold text-rose-500">
                {missingRequired.length}
              </span>
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {missingRequired.map((kw, i) => (
                <span key={i} className="px-2 py-1 text-xs font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 rounded-lg">
                  {kw}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Missing Preferred Skills */}
        {missingPreferred.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-xs uppercase tracking-wider flex items-center text-amber-500">
              <AlertCircle className="w-3.5 h-3.5 mr-1.5" /> Missing Preferred Skills
              <span className="ml-1.5 rounded-full bg-amber-500/10 px-1.5 py-px text-[10px] font-bold text-amber-500">
                {missingPreferred.length}
              </span>
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {missingPreferred.map((kw, i) => (
                <span key={i} className="px-2 py-1 text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-lg">
                  {kw}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Matched Skills */}
        {matchedSkills.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-xs uppercase tracking-wider flex items-center text-emerald-500">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Verified Skills
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {matchedSkills.filter(s => s.present).map((s, i) => (
                <div key={i} className="px-2 py-1 text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-lg group relative">
                  {s.skill}
                  {s.evidence && (
                    <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 hidden group-hover:block w-52 p-2.5 bg-popover text-popover-foreground text-[11px] leading-snug rounded-lg shadow-xl border border-border z-50 text-left">
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
            <h4 className="font-semibold text-xs uppercase tracking-wider flex items-center text-violet-500 mb-2">
              Action Plan
            </h4>
            <ul className="space-y-2 rounded-xl bg-violet-500/[0.07] border border-violet-500/15 p-3.5">
              {recommendations.map((rec, i) => (
                <li key={i} className="text-sm text-foreground/85 flex items-start leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-500/70 mt-2 mr-2.5 shrink-0" />
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
