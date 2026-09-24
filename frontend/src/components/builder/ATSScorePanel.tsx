import { CheckCircle2, XCircle, Lightbulb } from "lucide-react"

interface ATSScorePanelProps {
  score: number;
  matchingKeywords: string[];
  missingKeywords: string[];
  recommendations: string[];
}

export function ATSScorePanel({ score, matchingKeywords, missingKeywords, recommendations }: ATSScorePanelProps) {
  // Determine color based on score
  const getScoreColor = (s: number) => {
    if (s >= 80) return "text-emerald-500"
    if (s >= 60) return "text-amber-500"
    return "text-rose-500"
  }

  const scoreColor = getScoreColor(score)

  return (
    <div className="bg-card/50 backdrop-blur-xl border border-border shadow-xl rounded-2xl p-6 flex flex-col relative overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold tracking-tight">ATS Match Score</h3>
          <p className="text-sm text-muted-foreground">Compared against your Target Job Description</p>
        </div>
        <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
            <path
              className="text-muted/30"
              strokeWidth="3"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className={`${scoreColor} transition-all duration-1000 ease-out`}
              strokeDasharray={`${score}, 100`}
              strokeWidth="3"
              strokeLinecap="round"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <div className={`absolute inset-0 flex items-center justify-center text-xl font-extrabold ${scoreColor}`}>
            {score}%
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Missing Keywords */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm flex items-center text-rose-500">
            <XCircle className="w-4 h-4 mr-2" /> Missing Keywords
          </h4>
          <div className="flex flex-wrap gap-2">
            {missingKeywords.length > 0 ? missingKeywords.map((kw, i) => (
              <span key={i} className="px-2.5 py-1 text-xs font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 rounded-md">
                {kw}
              </span>
            )) : <span className="text-sm text-muted-foreground">No missing keywords!</span>}
          </div>
        </div>

        {/* Matching Keywords */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm flex items-center text-emerald-500">
            <CheckCircle2 className="w-4 h-4 mr-2" /> Matching Keywords
          </h4>
          <div className="flex flex-wrap gap-2">
            {matchingKeywords.length > 0 ? matchingKeywords.map((kw, i) => (
              <span key={i} className="px-2.5 py-1 text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-md">
                {kw}
              </span>
            )) : <span className="text-sm text-muted-foreground">No matching keywords found.</span>}
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="mt-6 pt-5 border-t border-border/50">
          <h4 className="font-semibold text-sm flex items-center text-amber-500 mb-3">
            <Lightbulb className="w-4 h-4 mr-2" /> AI Recommendations
          </h4>
          <ul className="space-y-2">
            {recommendations.map((rec, i) => (
              <li key={i} className="text-sm text-foreground/80 flex items-start">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500/50 mt-1.5 mr-2 shrink-0" />
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
