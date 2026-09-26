import { CheckCircle2, XCircle, Lightbulb, Plus, Check } from "lucide-react"
import { includesTerm } from "@/lib/utils"

interface ATSScorePanelProps {
  score: number;
  matchingKeywords: string[];
  missingKeywords: string[];
  recommendations: string[];
  skills?: string[];
  onAddKeyword?: (keyword: string) => void;
}

export function ATSScorePanel({
  score,
  matchingKeywords,
  missingKeywords,
  recommendations,
  skills = [],
  onAddKeyword,
}: ATSScorePanelProps) {
  // Determine color based on score
  const getScoreColor = (s: number) => {
    if (s >= 80) return "text-emerald-500"
    if (s >= 60) return "text-amber-500"
    return "text-rose-500"
  }

  const getScoreLabel = (s: number) => {
    if (s >= 80) return "Excellent match"
    if (s >= 60) return "Good — room to improve"
    return "Needs work"
  }

  const getScoreBadge = (s: number) => {
    if (s >= 80) return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
    if (s >= 60) return "bg-amber-500/10 text-amber-600 dark:text-amber-400"
    return "bg-rose-500/10 text-rose-600 dark:text-rose-400"
  }

  const scoreColor = getScoreColor(score)

  return (
    <div className="bg-card/60 backdrop-blur-xl border border-border/70 shadow-xl rounded-2xl p-5 sm:p-6 flex flex-col relative overflow-hidden">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="min-w-0">
          <h3 className="text-lg font-bold tracking-tight">ATS Match Score</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Compared against your target job description</p>
          <span className={`inline-block mt-2 text-xs font-semibold px-2.5 py-1 rounded-full ${getScoreBadge(score)}`}>
            {getScoreLabel(score)}
          </span>
        </div>
        <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36" aria-hidden="true">
            <path
              className="text-muted/40"
              strokeWidth="2.5"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className={`${scoreColor} transition-all duration-1000 ease-out`}
              strokeDasharray={`${score}, 100`}
              strokeWidth="2.5"
              strokeLinecap="round"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <div
            className={`absolute inset-0 flex flex-col items-center justify-center ${scoreColor}`}
            role="img"
            aria-label={`ATS match score: ${score} percent`}
          >
            <span className="text-2xl font-extrabold leading-none">{score}%</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider opacity-80 mt-0.5">ATS</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Missing Keywords */}
        <div className="space-y-2.5">
          <div>
            <h4 className="font-semibold text-xs uppercase tracking-wider flex items-center text-rose-500">
              <XCircle className="w-3.5 h-3.5 mr-1.5" /> Missing Keywords
              <span className="ml-1.5 rounded-full bg-rose-500/10 px-1.5 py-px text-[10px] font-bold text-rose-500">
                {missingKeywords.filter((kw) => !includesTerm(skills, kw)).length}
              </span>
            </h4>
            {onAddKeyword && missingKeywords.length > 0 && (
              <p className="mt-1 text-[11px] text-muted-foreground">Click a keyword to add it to Skills</p>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {missingKeywords.length > 0 ? missingKeywords.map((kw, i) => {
              const added = includesTerm(skills, kw)
              return added ? (
                <span
                  key={i}
                  title="Already in your skills"
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-lg"
                >
                  <Check className="w-3 h-3" aria-hidden="true" />
                  {kw}
                </span>
              ) : (
                <button
                  key={i}
                  type="button"
                  onClick={() => onAddKeyword?.(kw)}
                  title={`Add "${kw}" to Skills`}
                  className="group/kw inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 rounded-lg transition-colors hover:border-rose-500/50 hover:bg-rose-500/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                >
                  {kw}
                  <Plus className="w-3 h-3 opacity-50 transition-opacity group-hover/kw:opacity-100" aria-hidden="true" />
                </button>
              )
            }) : (
              <span className="inline-flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                <CheckCircle2 className="w-4 h-4" /> Nothing missing!
              </span>
            )}
          </div>
        </div>

        {/* Matching Keywords */}
        <div className="space-y-2.5">
          <h4 className="font-semibold text-xs uppercase tracking-wider flex items-center text-emerald-500">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Matching Keywords
            <span className="ml-1.5 rounded-full bg-emerald-500/10 px-1.5 py-px text-[10px] font-bold text-emerald-500">
              {matchingKeywords.length}
            </span>
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {matchingKeywords.length > 0 ? matchingKeywords.map((kw, i) => (
              <span key={i} className="px-2 py-1 text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-lg">
                {kw}
              </span>
            )) : <span className="text-sm text-muted-foreground">No matching keywords found.</span>}
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="mt-5 pt-5 border-t border-border/60">
          <h4 className="font-semibold text-xs uppercase tracking-wider flex items-center text-amber-500 mb-3">
            <Lightbulb className="w-3.5 h-3.5 mr-1.5" /> AI Recommendations
          </h4>
          <ul className="space-y-2 rounded-xl bg-amber-500/[0.07] border border-amber-500/15 p-3.5">
            {recommendations.map((rec, i) => (
              <li key={i} className="text-sm text-foreground/85 flex items-start leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500/70 mt-2 mr-2.5 shrink-0" />
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
