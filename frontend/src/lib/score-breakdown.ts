import type { Resume } from "@/store/slices/resume-slice"

export interface ScoreBreakdown {
  /** matched / (matched + missing) against the target job description */
  keywordMatch: number | null
  /** share of resume bullets that contain a measurable number */
  quantifiedImpact: number | null
  /** why the quantified-impact score is what it is */
  quantifiedHint: string
  /** structural completeness of the resume document */
  formatting: number | null
  /** plain-language reasons behind the formatting score (empty when complete) */
  formattingHints: string[]
}

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)))

/**
 * Keyword match from the two keyword sets already computed for the ATS panel.
 * Returns null when the job description yielded no keywords to compare.
 */
export function keywordMatchScore(matchedCount: number, missingCount: number): number | null {
  const total = matchedCount + missingCount
  if (total === 0) return null
  return clamp((matchedCount / total) * 100)
}

function collectBullets(resume: Resume | null): string[] {
  if (!resume) return []
  const fromExperience = (resume.experiences || []).flatMap((exp) => exp.description || [])
  const fromProjects = (resume.projects || []).flatMap((project) => project.description || [])
  return [...fromExperience, ...fromProjects].map((b) => (b || "").trim()).filter(Boolean)
}

/** Share of bullets containing a digit — "30%", "2 years", "2024" all count as measurable. */
export function quantifiedImpactScore(resume: Resume | null): { value: number | null; hint: string } {
  const bullets = collectBullets(resume)
  if (bullets.length === 0) {
    return { value: null, hint: "No bullet points to measure yet" }
  }
  const quantified = bullets.filter((bullet) => /\d/.test(bullet)).length
  const value = clamp((quantified / bullets.length) * 100)
  return {
    value,
    hint:
      value < 50
        ? `${bullets.length - quantified} bullets have no numbers — add metrics like %, $ or timeframes`
        : "Strong use of measurable results",
  }
}

/**
 * Structural completeness, weighted so each missing building block is visible:
 * summary 25 · experience 25 · bullet depth 20 · skills 15 · projects 10 · education 5
 */
export function formattingScore(resume: Resume | null): { value: number | null; hints: string[] } {
  if (!resume) return { value: null, hints: ["Nothing to score yet"] }

  const hints: string[] = []
  let score = 0

  if (resume.summary && resume.summary.trim()) {
    score += 25
  } else {
    hints.push("Add a professional summary")
  }

  const experiences = resume.experiences || []
  if (experiences.length > 0) {
    score += 25

    const bulletsPerRole =
      experiences.reduce((sum, exp) => sum + (exp.description || []).filter((b) => b && b.trim()).length, 0) /
      experiences.length
    const depth = Math.min(1, bulletsPerRole / 2)
    score += 20 * depth
    if (depth < 1) hints.push("Aim for at least 2 bullets per role")
  } else {
    hints.push("Add at least one work experience")
  }

  const hasSkills = (resume.skills || []).some((group) => (group.skills || []).some((s) => s && s.trim()))
  if (hasSkills) {
    score += 15
  } else {
    hints.push("Add a skills section")
  }

  if ((resume.projects || []).length > 0) {
    score += 10
  } else {
    hints.push("Add a projects section")
  }

  if ((resume.education || []).length > 0) {
    score += 5
  } else {
    hints.push("Add education")
  }

  return { value: clamp(score), hints }
}

export function computeScoreBreakdown(
  resume: Resume | null,
  matchedCount: number,
  missingCount: number
): ScoreBreakdown {
  const quantified = quantifiedImpactScore(resume)
  const formatting = formattingScore(resume)

  return {
    keywordMatch: keywordMatchScore(matchedCount, missingCount),
    quantifiedImpact: quantified.value,
    quantifiedHint: quantified.hint,
    formatting: formatting.value,
    formattingHints: formatting.hints,
  }
}
