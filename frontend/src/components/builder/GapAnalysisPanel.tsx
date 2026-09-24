import { CheckCircle2, AlertCircle, XCircle } from "lucide-react"

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
  relevantExperiences,
  recommendations,
}: GapAnalysisPanelProps) {
  return (
    <div className="bg-card/50 backdrop-blur-xl border border-border shadow-xl rounded-2xl p-6 flex flex-col relative overflow-hidden h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold tracking-tight">Gap Analysis</h3>
          <p className="text-sm text-muted-foreground">Deep dive into missing requirements</p>
        </div>
        <div className="text-2xl font-extrabold text-violet-500">
          {overallMatchPercent}% Match
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 pr-2">
        {/* Missing Required Skills */}
        {missingRequired.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-sm flex items-center text-rose-500">
              <XCircle className="w-4 h-4 mr-2" /> Missing Required Skills
            </h4>
            <div className="flex flex-wrap gap-2">
              {missingRequired.map((kw, i) => (
                <span key={i} className="px-2.5 py-1 text-xs font-medium bg-rose-500/10 text-rose-600 border border-rose-500/20 rounded-md">
                  {kw}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Missing Preferred Skills */}
        {missingPreferred.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-sm flex items-center text-amber-500">
              <AlertCircle className="w-4 h-4 mr-2" /> Missing Preferred Skills
            </h4>
            <div className="flex flex-wrap gap-2">
              {missingPreferred.map((kw, i) => (
                <span key={i} className="px-2.5 py-1 text-xs font-medium bg-amber-500/10 text-amber-600 border border-amber-500/20 rounded-md">
                  {kw}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Matched Skills */}
        {matchedSkills.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-sm flex items-center text-emerald-500">
              <CheckCircle2 className="w-4 h-4 mr-2" /> Verified Skills
            </h4>
            <div className="flex flex-wrap gap-2">
              {matchedSkills.filter(s => s.present).map((s, i) => (
                <div key={i} className="px-2.5 py-1 text-xs font-medium bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded-md group relative">
                  {s.skill}
                  {s.evidence && (
                    <div className="absolute bottom-full mb-1 hidden group-hover:block w-48 p-2 bg-black text-white text-[10px] rounded shadow-xl z-50">
                      "{s.evidence}"
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actionable Recommendations */}
        {recommendations.length > 0 && (
          <div className="space-y-2 border-t border-border/50 pt-4 mt-2">
            <h4 className="font-semibold text-sm flex items-center text-violet-500 mb-2">
              Action Plan
            </h4>
            <ul className="space-y-2">
              {recommendations.map((rec, i) => (
                <li key={i} className="text-sm text-foreground/80 flex items-start">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-500/50 mt-1.5 mr-2 shrink-0" />
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
