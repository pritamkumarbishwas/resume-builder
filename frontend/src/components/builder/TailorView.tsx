import { useState, useRef, useEffect, useCallback } from "react"
import type { ChangeEvent, KeyboardEvent } from "react"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import {
  useRewriteBulletsMutation,
  useGenerateSummaryMutation,
  useGetAtsScoreMutation
} from "@/store/api/resume-api"
import { API_BASE_URL } from "@/store/api/resume-api"
import { updateExperienceBullets, updateSummary, updateSkillGroup, updateSkillCategory, addSkillGroup, removeSkillGroup } from "@/store/slices/resume-slice"
import { Button } from "@/components/ui/button"
import { Sparkles, Download, Briefcase, Copy, Check, FileText, History, Save, Layers, X, Plus, FolderGit2, GraduationCap } from "lucide-react"
import { ATSScorePanel } from "./ATSScorePanel"
import { ScoreBreakdownCard } from "./ScoreBreakdownCard"
import { CoverLetterModal } from "./CoverLetterModal"
import { GapAnalysisPanel } from "./GapAnalysisPanel"
import { ChatEditorModal } from "./ChatEditorModal"
import { JobDescriptionCard } from "./JobDescriptionCard"
import { ProjectsSection } from "./ProjectsSection"
import { EducationSection } from "./EducationSection"
import { AutoResizeTextarea } from "@/components/ui/auto-resize-textarea"
import { useGetGapReportMutation, useSaveVersionMutation, useGetVersionsQuery } from "@/store/api/resume-api"
import { containsToken, includesTerm, normalizeMatchText } from "@/lib/utils"
import { computeScoreBreakdown } from "@/lib/score-breakdown"
import { setResume, setJobDescription } from "@/store/slices/resume-slice"

function PanelSkeleton({ label }: { label: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
      <div className="mb-5 flex items-center gap-2.5">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary/40 border-t-primary" />
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
      </div>
      <div className="space-y-3">
        <div className="skeleton h-4 w-1/3" />
        <div className="skeleton h-4 w-2/3" />
        <div className="skeleton h-4 w-1/2" />
      </div>
    </div>
  )
}

const KEYWORD_FALLBACK_GROUP = "Skills"

type SkillGroupLike = { category: string; skills: string[] }

function tokenize(text: string): string[] {
  return text.toLowerCase().replace(/[^\p{L}\p{N}+#]+/gu, " ").split(" ").filter(Boolean)
}

const stemOf = (token: string) => (token.length > 4 ? token.slice(0, 4) : token)

function tokensRelated(a: string, b: string): boolean {
  if (a === b) return true
  if (a.length >= 3 && b.length >= 3 && (a.startsWith(b) || b.startsWith(a))) return true
  return stemOf(a) === stemOf(b)
}

/**
 * Chooses the group a keyword most likely belongs to:
 * category-name matches count the most, then overlap with existing skills,
 * falling back to the first group when nothing is related.
 * Returns -1 when the resume has no groups at all.
 */
function bestSkillGroupIndex(groups: SkillGroupLike[], keyword: string): number {
  if (groups.length === 0) return -1

  const kwTokens = tokenize(keyword)
  if (kwTokens.length === 0) return 0

  let bestIdx = 0
  let bestScore = 0

  groups.forEach((group, i) => {
    const catTokens = tokenize(group.category || "")
    const skillTokens = (group.skills || []).flatMap(tokenize)
    let score = 0

    for (const kw of kwTokens) {
      for (const cat of catTokens) {
        if (kw === cat) score += 5
        else if (tokensRelated(kw, cat)) score += 3
      }
      for (const skill of skillTokens) {
        if (kw === skill) score += 2
        else if (tokensRelated(kw, skill)) score += 1
      }
    }

    if (score > bestScore) {
      bestScore = score
      bestIdx = i
    }
  })

  return bestScore > 0 ? bestIdx : 0
}

type SkillEdit =
  | { type: "chip"; group: number; skill: number }
  | { type: "add"; group: number }
  | { type: "category"; group: number }

const RESUME_TABS = [
  { id: "summary", label: "Summary", icon: Sparkles },
  { id: "experience", label: "Experience", icon: Briefcase },
  { id: "projects", label: "Projects", icon: FolderGit2 },
  { id: "education", label: "Education", icon: GraduationCap },
  { id: "skills", label: "Skills", icon: Layers },
] as const

type SectionId = (typeof RESUME_TABS)[number]["id"]

export function TailorView() {
  const dispatch = useAppDispatch()
  const resume = useAppSelector((state) => state.resume.resume)
  const jobDescription = useAppSelector((state) => state.resume.jobDescription)

  const [rewriteBullets, { isLoading: isRewriting }] = useRewriteBulletsMutation()
  const [generateSummary, { isLoading: isGenerating }] = useGenerateSummaryMutation()
  const [getAtsScore, { isLoading: isScoring }] = useGetAtsScoreMutation()

  const [activeExpIndex, setActiveExpIndex] = useState<number | null>(null)
  const [copiedExpIndex, setCopiedExpIndex] = useState<number | null>(null)
  const [atsData, setAtsData] = useState<any>(null)
  const [gapData, setGapData] = useState<any>(null)
  const [showCoverLetter, setShowCoverLetter] = useState(false)
  const [showChatEditor, setShowChatEditor] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [skillEdit, setSkillEdit] = useState<SkillEdit | null>(null)
  const [skillDraft, setSkillDraft] = useState("")
  const [activeSection, setActiveSection] = useState<SectionId>("summary")

  // Dummy session ID for now
  const sessionId = "session-123"

  const [getGapReport, { isLoading: isGapLoading }] = useGetGapReportMutation()
  const [saveVersion] = useSaveVersionMutation()
  const { data: versions, refetch: refetchVersions } = useGetVersionsQuery(sessionId)

  const resumeRef = useRef(resume)
  const jobDescRef = useRef(jobDescription)
  resumeRef.current = resume
  jobDescRef.current = jobDescription

  const lastScoredKeyRef = useRef<string | null>(null)
  const inFlightRef = useRef(false)
  const needsRescoreRef = useRef(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const runAtsScore = useCallback(async () => {
    if (inFlightRef.current) {
      needsRescoreRef.current = true
      return
    }
    const r = resumeRef.current
    const jd = jobDescRef.current
    if (!r || !jd) return

    const key = JSON.stringify({ resume: r, job_description: jd })
    if (key === lastScoredKeyRef.current) return

    inFlightRef.current = true
    try {
      const data = await getAtsScore({ resume: r, job_description: jd }).unwrap()
      setAtsData(data)
      // Also fetch gap report
      try {
        const gaps = await getGapReport({ resume: r, job_description: jd }).unwrap()
        setGapData(gaps)
      } catch (err) {
        console.error("Failed to fetch gap report", err)
      }
      lastScoredKeyRef.current = key
    } catch (err) {
      console.error(err)
    } finally {
      inFlightRef.current = false
      if (needsRescoreRef.current) {
        needsRescoreRef.current = false
        void runAtsScore()
      }
    }
  }, [getAtsScore])

  // Debounced ATS rescore on resume/JD changes (skips StrictMode double-mount via cleanup)
  useEffect(() => {
    if (!resume || !jobDescription) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    // 2.5s of quiet before rescoring: each run costs 2 LLM calls and the
    // model has a tight TPM rate limit, so avoid firing on typing pauses
    const delay = lastScoredKeyRef.current === null ? 0 : 2500
    debounceRef.current = setTimeout(() => {
      void runAtsScore()
    }, delay)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [resume, jobDescription, runAtsScore])

  if (!resume) return null

  // Presentation-only helpers (derived from state already in the store)
  const jdNormalized = normalizeMatchText(jobDescription)
  const isSkillInJD = (skill: string) => containsToken(jdNormalized, skill)
  const skillGroups = resume.skills || []

  // Unique, non-empty skills: chips can repeat a skill across groups and the
  // parser can emit blanks — neither belongs in the counts
  const seenSkills = new Set<string>()
  const allSkills: string[] = []
  for (const raw of skillGroups.flatMap((group) => group.skills || [])) {
    const skill = raw.trim()
    if (!skill) continue
    const key = skill.toLowerCase()
    if (seenSkills.has(key)) continue
    seenSkills.add(key)
    allSkills.push(skill)
  }

  // One source of truth for the "N matched" badge and the ATS panel
  const matchedSkills = allSkills.filter(isSkillInJD)
  const matchedSkillCount = matchedSkills.length

  // Everything the resume actually mentions — used to drop false "missing" keywords
  const resumeNormalized = normalizeMatchText(
    [
      resume.summary || "",
      ...(resume.experiences || []).flatMap((exp) => [exp.title, exp.company, ...(exp.description || [])]),
      ...(resume.projects || []).flatMap((p) => [p.name, ...(p.technologies || []), ...(p.description || [])]),
      ...(resume.education || []).flatMap((e) => [e.degree, e.institution]),
      ...allSkills,
    ]
      .filter(Boolean)
      .join("\n"),
  )

  const isPresentInResume = (keyword: string) =>
    includesTerm(allSkills, keyword) ||
    containsToken(resumeNormalized, keyword) ||
    allSkills.some((skill) => containsToken(normalizeMatchText(keyword), skill))

  // Keywords the JD wants but the resume never mentions (the same set the ATS panel reports)
  const missingKeywords: string[] = ((atsData?.missing_keywords || []) as string[]).filter(
    (kw) => !isPresentInResume(kw)
  )

  // Score breakdown derived from existing data — no extra API round-trip
  const breakdown = computeScoreBreakdown(resume, matchedSkillCount, missingKeywords.length)

  // Per-tab badges (null = no count shown)
  const sectionCounts: Record<SectionId, number | null> = {
    summary: null,
    experience: (resume.experiences || []).length,
    projects: (resume.projects || []).length,
    education: (resume.education || []).length,
    skills: allSkills.length,
  }

  // Arrow-key navigation across the section tabs
  const handleTabKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return
    e.preventDefault()
    const current = RESUME_TABS.findIndex((t) => t.id === activeSection)
    const next =
      e.key === "ArrowRight"
        ? (current + 1) % RESUME_TABS.length
        : (current - 1 + RESUME_TABS.length) % RESUME_TABS.length
    const id = RESUME_TABS[next].id
    setActiveSection(id)
    requestAnimationFrame(() => document.getElementById(`tab-${id}`)?.focus())
  }

  // Click a missing keyword/skill in the analysis panels → add it to the
  // group it best belongs to (category name first, then related skills)
  const handleAddKeyword = (keyword: string) => {
    const kw = keyword.trim()
    if (!kw || includesTerm(allSkills, kw)) return

    const groupIdx = bestSkillGroupIndex(skillGroups, kw)

    if (groupIdx >= 0) {
      dispatch(updateSkillGroup({ index: groupIdx, skills: [...skillGroups[groupIdx].skills, kw] }))
    } else {
      dispatch(addSkillGroup({ category: KEYWORD_FALLBACK_GROUP, skills: [kw] }))
    }
  }

  // ── Skill editing ──
  const startSkillEdit = (edit: SkillEdit, initial: string) => {
    setSkillEdit(edit)
    setSkillDraft(initial)
  }

  const cancelSkillEdit = () => {
    setSkillEdit(null)
    setSkillDraft("")
  }

  const commitSkillEdit = () => {
    if (!skillEdit) return
    const value = skillDraft.trim()

    if (skillEdit.type === "category") {
      const group = skillGroups[skillEdit.group]
      if (group && value) {
        dispatch(updateSkillCategory({ index: skillEdit.group, category: value }))
      }
    } else if (skillEdit.type === "chip") {
      const group = skillGroups[skillEdit.group]
      if (group && value && skillEdit.skill < group.skills.length) {
        const next = [...group.skills]
        next[skillEdit.skill] = value
        dispatch(updateSkillGroup({ index: skillEdit.group, skills: next }))
      }
    } else if (skillEdit.type === "add") {
      const group = skillGroups[skillEdit.group]
      if (group && value) {
        dispatch(updateSkillGroup({ index: skillEdit.group, skills: [...group.skills, value] }))
      }
    }

    setSkillEdit(null)
    setSkillDraft("")
  }

  const skillInputProps = (placeholder: string) => ({
    value: skillDraft,
    onChange: (e: ChangeEvent<HTMLInputElement>) => setSkillDraft(e.target.value),
    onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault()
        commitSkillEdit()
      } else if (e.key === "Escape") {
        e.preventDefault()
        cancelSkillEdit()
      }
    },
    onBlur: commitSkillEdit,
    placeholder,
    autoFocus: true,
    className:
      "w-32 bg-transparent text-xs font-medium text-foreground outline-none placeholder:text-muted-foreground/70",
  })

  const removeSkillAt = (groupIndex: number, skillIndex: number) => {
    const group = skillGroups[groupIndex]
    if (!group) return
    dispatch(updateSkillGroup({ index: groupIndex, skills: group.skills.filter((_, i) => i !== skillIndex) }))
  }

  const handleCopyExperience = (idx: number, exp: any) => {
    const text = `${exp.title} at ${exp.company}\n${exp.start_date} - ${exp.end_date || "Present"}\n\n${(exp.description || []).map((b: string) => `• ${b}`).join("\n")}`
    navigator.clipboard.writeText(text)
    setCopiedExpIndex(idx)
    setTimeout(() => setCopiedExpIndex(null), 2000)
  }

  const handleRewriteBullets = async (index: number, original_bullets: string[]) => {
    setActiveExpIndex(index)
    try {
      const res = await rewriteBullets({
        original_bullets,
        job_description: jobDescription,
      }).unwrap()
      dispatch(updateExperienceBullets({ index, bullets: res.rewritten_bullets }))
    } catch (err) {
      console.error(err)
    } finally {
      setActiveExpIndex(null)
    }
  }

  const handleGenerateSummary = async () => {
    try {
      const resumeText = JSON.stringify(resume)
      const res = await generateSummary({
        resume_text: resumeText,
        job_description: jobDescription,
      }).unwrap()
      dispatch(updateSummary(res.summary))
    } catch (err) {
      console.error(err)
    }
  }

  const handleExport = async (templateName: string = "classic") => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/export/pdf?template=${templateName}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(resume),
      })
      if (!res.ok) throw new Error("Export failed")

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "Tailored_Resume.pdf"
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error(err)
      alert("Failed to export PDF.")
    }
  }

  const handleSaveVersion = async () => {
    try {
      const label = prompt("Enter a label for this version (e.g. 'Tailored for Google'):")
      if (!label) return

      await saveVersion({
        session_id: sessionId,
        label,
        resume,
        job_description: jobDescription,
        ats_score: atsData?.score || 0
      }).unwrap()
      alert("Version saved successfully!")
      refetchVersions()
    } catch (err) {
      console.error(err)
      alert("Failed to save version.")
    }
  }

  const handleLoadVersion = (version: any) => {
    if (confirm("Are you sure you want to load this version? Any unsaved changes will be lost.")) {
      dispatch(setResume(version.resume))
      if (version.job_description) {
        dispatch(setJobDescription(version.job_description))
      }
    }
  }

  return (
    <div className="w-full max-w-7xl mx-auto flex animate-fade-in flex-col gap-5 pt-6 pb-8 lg:h-[calc(100dvh-4rem)] lg:overflow-hidden">
      <div className="flex shrink-0 flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Optimize Your Resume</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Perfect your resume. Let our AI tailor your experience to match the exact requirements of your target role.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowHistory(!showHistory)}
            aria-expanded={showHistory}
            className={`rounded-full px-3.5 ${
              showHistory
                ? "border-primary/50 bg-primary/10 text-primary"
                : "border-border/70 text-foreground/80 hover:bg-muted/60"
            }`}
          >
            <History className="mr-1.5 h-3.5 w-3.5" />
            History
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleSaveVersion}
            className="rounded-full border-border/70 px-3.5 text-foreground/80 hover:bg-muted/60"
          >
            <Save className="mr-1.5 h-3.5 w-3.5" />
            Save Version
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowChatEditor(true)}
            className="rounded-full border-primary/40 px-3.5 text-primary hover:bg-primary/10"
          >
            <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Chat Edit
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowCoverLetter(true)}
            className="rounded-full border-border/70 px-3.5 text-foreground/80 hover:bg-muted/60"
          >
            <FileText className="mr-1.5 h-3.5 w-3.5" /> Cover Letter
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleExport("classic")}
            className="rounded-full border-border/70 px-3.5 text-foreground/80 hover:bg-muted/60"
          >
            <Download className="mr-1.5 h-3.5 w-3.5" /> Classic PDF
          </Button>
          <Button
            size="sm"
            onClick={() => handleExport("modern")}
            className="rounded-full bg-primary px-4 text-primary-foreground shadow-sm hover:bg-primary/90"
          >
            <Download className="mr-1.5 h-3.5 w-3.5" /> Modern PDF
          </Button>
        </div>
      </div>

      {/* Two-column workspace — left: resume content, right: ATS insights */}
      <div className="grid min-h-0 flex-1 gap-5 lg:grid-cols-[minmax(0,1fr)_24rem] lg:grid-rows-[minmax(0,1fr)] xl:gap-6">
        {/* Left column: resume */}
        <div className="flex min-w-0 flex-col gap-4 lg:min-h-0 lg:overflow-y-auto lg:pr-1 lg:pb-2 custom-scrollbar">
          {/* Section tabs */}
            <div
              role="tablist"
              aria-label="Resume sections"
              aria-orientation="horizontal"
              onKeyDown={handleTabKeyDown}
              className="sticky top-16 z-20 flex gap-1.5 overflow-x-auto rounded-2xl border border-border/60 bg-card/95 p-1.5 shadow-sm backdrop-blur-xl custom-scrollbar lg:top-0"
            >
              {RESUME_TABS.map((tab) => {
                const active = activeSection === tab.id
                const Icon = tab.icon
                const count = sectionCounts[tab.id]
                return (
                  <button
                    key={tab.id}
                    id={`tab-${tab.id}`}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    aria-controls={`section-${tab.id}`}
                    onClick={() => setActiveSection(tab.id)}
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 ${
                      active
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                    }`}
                  >
                    <Icon className="w-4 h-4" aria-hidden="true" />
                    {tab.label}
                    {count !== null && (
                      <span
                        className={`rounded-full px-1.5 py-px text-[10px] font-bold ${
                          active ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Summary Section */}
            {activeSection === "summary" && (
            <div role="tabpanel" id="section-summary" aria-labelledby="tab-summary">
              <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm sm:p-6">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-primary/25 bg-primary/10">
                      <Sparkles className="h-4 w-4 text-primary" />
                    </div>
                    <div className="leading-tight">
                      <h3 className="text-lg font-bold">Executive Summary</h3>
                      <p className="text-xs text-muted-foreground">Click anywhere in the text to edit</p>
                    </div>
                  </div>

                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleGenerateSummary}
                    disabled={isGenerating}
                    className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white shadow-lg shadow-violet-500/25 rounded-full px-5 h-9 transition-all"
                  >
                    {isGenerating ? (
                      <>
                        <div className="w-4 h-4 mr-2 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        Crafting...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate with AI
                      </>
                    )}
                  </Button>
                </div>

                <div className="relative">
                  <AutoResizeTextarea
                    value={resume.summary || ""}
                    onChange={(newVal) => dispatch(updateSummary(newVal))}
                    className="w-full bg-background/50 border border-border/50 hover:bg-muted/40 focus:bg-background focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20 rounded-2xl p-5 text-[15px] leading-relaxed resize-none transition-all outline-none placeholder:text-muted-foreground/70"
                    placeholder="Click 'Generate with AI' to let our agent craft a compelling professional summary perfectly tailored to your target role..."
                    minHeight="140px"
                  />
                </div>
              </div>
            </div>

            )}
            {/* Experience Section */}
            {activeSection === "experience" && (
            <div role="tabpanel" id="section-experience" aria-labelledby="tab-experience">
              <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm sm:p-6">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-primary/25 bg-primary/10">
                    <Briefcase className="h-4 w-4 text-primary" />
                  </div>
                  <div className="leading-tight">
                    <h3 className="text-lg font-bold">Work Experience</h3>
                    <p className="text-xs text-muted-foreground">Tighten each bullet so it leads with impact</p>
                  </div>
                </div>

                <div className="space-y-6">
                  {(resume.experiences || []).length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8 border border-dashed border-border/70 rounded-2xl">
                      No experience entries found in this resume.
                    </p>
                  )}
                  {(resume.experiences || []).map((exp, idx) => (
                    <div key={idx} className="border border-border/50 bg-background/40 hover:bg-background/70 rounded-2xl p-5 sm:p-6 relative overflow-hidden group/card transition-colors duration-300">
                      <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-violet-500/60 to-fuchsia-500/60 opacity-0 group-hover/card:opacity-100 transition-opacity" aria-hidden="true" />
                      <div className="flex flex-wrap justify-between items-start gap-3 mb-4">
                        <div className="min-w-0">
                          <h4 className="font-bold text-base sm:text-lg text-foreground/90">{exp.title}</h4>
                          <div className="flex flex-wrap items-center text-sm text-muted-foreground gap-2 mt-1">
                            <span className="font-medium text-violet-600 dark:text-violet-300">{exp.company}</span>
                            <span className="opacity-40" aria-hidden="true">•</span>
                            <span>{exp.start_date} – {exp.end_date || "Present"}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 opacity-100 md:opacity-0 md:group-hover/card:opacity-100 transition-all duration-300">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCopyExperience(idx, exp)}
                            className="rounded-full border-border/60 hover:bg-background/80 shadow-sm h-8 px-3"
                            aria-label="Copy experience"
                          >
                            {copiedExpIndex === idx ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleRewriteBullets(idx, exp.description)}
                            disabled={isRewriting && activeExpIndex === idx}
                            className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white shadow-md shadow-violet-500/20 rounded-full h-8 px-3.5"
                          >
                            {isRewriting && activeExpIndex === idx ? (
                              <>
                                <div className="w-3 h-3 mr-2 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                Optimizing...
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-3 h-3 mr-2" />
                                Enhance with AI
                              </>
                            )}
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2 mt-5">
                        {(exp.description || []).map((bullet, bIdx) => (
                          <div key={bIdx} className="flex gap-3 items-start group/bullet relative">
                            {/* Perfectly aligned, modern bullet point */}
                            <div className="mt-[11px] w-2 h-2 rounded-full border border-fuchsia-500/50 bg-fuchsia-500/20 shrink-0 group-hover/bullet:bg-fuchsia-500 group-hover/bullet:border-fuchsia-500 group-hover/bullet:shadow-[0_0_12px_rgba(217,70,239,0.7)] group-hover/bullet:scale-125 transition-all duration-300" />

                            <AutoResizeTextarea
                              value={bullet}
                              onChange={(newVal) => {
                                const newBullets = [...exp.description]
                                newBullets[bIdx] = newVal
                                dispatch(updateExperienceBullets({ index: idx, bullets: newBullets }))
                              }}
                              className="w-full text-sm bg-transparent border border-transparent hover:bg-muted/40 focus:bg-background focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20 resize-none py-2 px-3 -ml-3 rounded-lg transition-all text-foreground/90 outline-none leading-relaxed"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                dispatch(
                                  updateExperienceBullets({
                                    index: idx,
                                    bullets: exp.description.filter((_, i) => i !== bIdx),
                                  }),
                                )
                              }
                              className="mt-1.5 rounded p-1 text-muted-foreground opacity-0 transition hover:bg-destructive/10 hover:text-destructive focus-visible:opacity-100 group-hover/bullet:opacity-100"
                              aria-label="Remove bullet"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() =>
                            dispatch(
                              updateExperienceBullets({
                                index: idx,
                                bullets: [...(exp.description || []), ""],
                              }),
                            )
                          }
                          className="ml-6 inline-flex items-center gap-1.5 rounded-full border border-dashed border-border/70 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-violet-500/50 hover:text-violet-600 dark:hover:text-violet-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add bullet
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            )}
            {/* Projects Section */}
            {activeSection === "projects" && (
            <div role="tabpanel" id="section-projects" aria-labelledby="tab-projects">
              <ProjectsSection />
            </div>
            )}

            {/* Education Section */}
            {activeSection === "education" && (
            <div role="tabpanel" id="section-education" aria-labelledby="tab-education">
              <EducationSection />
            </div>
            )}

            {/* Skills Section */}
            {activeSection === "skills" && (
            <div role="tabpanel" id="section-skills" aria-labelledby="tab-skills">
              <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm sm:p-6">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-primary/25 bg-primary/10">
                      <Layers className="h-4 w-4 text-primary" />
                    </div>
                    <div className="leading-tight">
                      <h3 className="text-lg font-bold">Skills</h3>
                      <p className="text-xs text-muted-foreground">
                        Click a skill to edit, hover to remove · green ones appear in the job description
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full border border-border/60 bg-background/60 px-2.5 py-1 text-xs font-medium text-muted-foreground">
                    {allSkills.length} total · {matchedSkillCount} matched
                  </span>
                </div>

                {skillGroups.length === 0 ? (
                  <div className="text-center py-8 border border-dashed border-border/70 rounded-2xl">
                    <p className="text-sm text-muted-foreground mb-4">No skills found in this resume.</p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full"
                      onClick={() => {
                        cancelSkillEdit()
                        dispatch(addSkillGroup({ category: "Skills" }))
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" /> Add skill group
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {skillGroups.map((group, gIdx) => (
                      <div key={gIdx} className="group/g">
                        <div className="mb-2 flex items-center gap-1.5">
                          {skillEdit?.type === "category" && skillEdit.group === gIdx ? (
                            <input
                              {...skillInputProps("Category name")}
                              className="w-40 rounded border border-violet-500/50 bg-background/70 px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-foreground outline-none placeholder:text-muted-foreground/70"
                            />
                          ) : (
                            <button
                              type="button"
                              onClick={() => startSkillEdit({ type: "category", group: gIdx }, group.category || "")}
                              className="rounded text-[11px] font-bold uppercase tracking-wider text-muted-foreground transition-colors hover:text-violet-600 dark:hover:text-violet-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                              title="Rename category"
                            >
                              {group.category || "Skills"}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              cancelSkillEdit()
                              dispatch(removeSkillGroup({ index: gIdx }))
                            }}
                            className="rounded p-0.5 text-muted-foreground opacity-0 transition hover:bg-destructive/10 hover:text-destructive focus-visible:opacity-100 group-hover/g:opacity-100"
                            aria-label={`Remove ${group.category || "skill group"}`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                          <span className="h-px flex-1 bg-border/60" aria-hidden="true" />
                          <span className="text-[10px] font-medium text-muted-foreground">
                            {(group.skills || []).length}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {(group.skills || []).map((skill, sIdx) => {
                            const matched = isSkillInJD(skill)
                            const isEditing =
                              skillEdit?.type === "chip" && skillEdit.group === gIdx && skillEdit.skill === sIdx
                            return (
                              <span
                                key={sIdx}
                                className={`group/chip inline-flex items-center rounded-lg border transition-colors ${
                                  isEditing
                                    ? "border-violet-500/50 bg-background/70 px-2 py-1"
                                    : matched
                                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                                      : "border-border/60 bg-muted/50 text-foreground/75 hover:border-violet-500/40 hover:text-foreground"
                                }`}
                              >
                                {isEditing ? (
                                  <input {...skillInputProps("Skill")} />
                                ) : (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => startSkillEdit({ type: "chip", group: gIdx, skill: sIdx }, skill)}
                                      className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                                      title="Click to edit"
                                    >
                                      {matched && <Check className="w-3 h-3" aria-hidden="true" />}
                                      {skill}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => removeSkillAt(gIdx, sIdx)}
                                      className="mr-1 rounded p-0.5 opacity-50 transition hover:bg-black/10 hover:opacity-100 focus-visible:opacity-100 dark:hover:bg-white/10 md:opacity-0 md:group-hover/chip:opacity-100"
                                      aria-label={`Remove ${skill}`}
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </>
                                )}
                              </span>
                            )
                          })}

                          {skillEdit?.type === "add" && skillEdit.group === gIdx ? (
                            <span className="inline-flex items-center rounded-lg border border-violet-500/50 bg-violet-500/10 px-2 py-1">
                              <input {...skillInputProps("New skill")} />
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => startSkillEdit({ type: "add", group: gIdx }, "")}
                              className="inline-flex items-center gap-1 rounded-lg border border-dashed border-border/70 px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-violet-500/50 hover:text-violet-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 dark:hover:text-violet-300"
                            >
                              <Plus className="w-3 h-3" /> Add
                            </button>
                          )}
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => {
                        cancelSkillEdit()
                        dispatch(addSkillGroup({ category: "Skills" }))
                      }}
                      className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-border/70 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-violet-500/50 hover:text-violet-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 dark:hover:text-violet-300"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add skill group
                    </button>
                  </div>
                )}
              </div>
            </div>
            )}
          </div>

          {/* Right column: ATS insights */}
          <div className="flex min-w-0 flex-col gap-4 lg:min-h-0 lg:overflow-y-auto lg:pl-1 lg:pb-2 custom-scrollbar">
            <JobDescriptionCard text={jobDescription} />

            {/* ATS score — the headline metric */}
            {isScoring && !atsData ? (
              <PanelSkeleton label="Analyzing ATS compatibility..." />
            ) : atsData ? (
              <ATSScorePanel score={atsData.score} updating={isScoring} />
            ) : null}

            {/* Score breakdown */}
            {atsData ? (
              <ScoreBreakdownCard
                breakdown={breakdown}
                matchingKeywords={matchedSkills}
                missingKeywords={missingKeywords}
                recommendations={atsData.recommendations}
                skills={allSkills}
                onAddKeyword={handleAddKeyword}
              />
            ) : null}

            {/* Skill gap analysis */}
            {isGapLoading && !gapData ? (
              <PanelSkeleton label="Running gap analysis..." />
            ) : gapData ? (
              <GapAnalysisPanel
                overallMatchPercent={gapData.overall_match_percent}
                matchedSkills={gapData.matched_skills}
                missingRequired={gapData.missing_required}
                missingPreferred={gapData.missing_preferred}
                relevantExperiences={gapData.relevant_experiences}
                recommendations={gapData.recommendations}
                skills={allSkills}
                onAddKeyword={handleAddKeyword}
                updating={isGapLoading}
              />
            ) : null}
          </div>
        </div>

        {/* Version history — overlay drawer */}
        {showHistory && (
          <>
            <div
              className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm"
              onClick={() => setShowHistory(false)}
              aria-hidden="true"
            />
            <aside
              aria-label="Version history"
              className="fixed inset-y-0 right-0 z-50 flex w-80 max-w-[85vw] animate-fade-in flex-col border-l border-border/60 bg-card p-5 shadow-xl"
            >
              <div className="mb-4 flex shrink-0 items-center justify-between">
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4 text-primary" />
                  <h3 className="text-base font-bold">Version History</h3>
                </div>
                <div className="flex items-center gap-2">
                  {versions && versions.length > 0 && (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                      {versions.length}
                    </span>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowHistory(false)}
                    aria-label="Close version history"
                    className="rounded-full px-2"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="custom-scrollbar -mr-2 overflow-y-auto pr-2">
                {!versions || versions.length === 0 ? (
                  <div className="px-2 py-8 text-center">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">No versions saved yet.</p>
                    <p className="mt-1 text-xs text-muted-foreground/70">
                      Save a version to compare different tailoring passes.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {versions.map((v: any) => (
                      <div
                        key={v.version_id}
                        className="group rounded-xl border border-border/60 bg-background/60 p-4 transition-colors hover:border-primary/40 hover:bg-background/80"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-semibold leading-snug">{v.label}</h4>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleLoadVersion(v)}
                            className="h-6 shrink-0 rounded-full px-2 text-xs opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
                          >
                            Restore
                          </Button>
                        </div>
                        <div className="mt-2.5 flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {new Date(v.created_at).toLocaleDateString()}
                          </span>
                          <span className="rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            ATS {v.ats_score}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </aside>
          </>
        )}

      <CoverLetterModal
        isOpen={showCoverLetter}
        onClose={() => setShowCoverLetter(false)}
        resume={resume}
        jobDescription={jobDescription}
      />

      <ChatEditorModal
        isOpen={showChatEditor}
        onClose={() => setShowChatEditor(false)}
        resume={resume}
        jobDescription={jobDescription}
      />
    </div>
  )
}
