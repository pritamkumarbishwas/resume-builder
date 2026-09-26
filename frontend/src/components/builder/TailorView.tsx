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
import { Sparkles, Download, Briefcase, Copy, Check, FileText, History, Save, Layers, Target, X, Plus } from "lucide-react"
import { ATSScorePanel } from "./ATSScorePanel"
import { CoverLetterModal } from "./CoverLetterModal"
import { GapAnalysisPanel } from "./GapAnalysisPanel"
import { ChatEditorModal } from "./ChatEditorModal"
import { useGetGapReportMutation, useSaveVersionMutation, useGetVersionsQuery } from "@/store/api/resume-api"
import { containsToken, includesTerm, normalizeMatchText } from "@/lib/utils"
import { setResume, setJobDescription } from "@/store/slices/resume-slice"

function PanelSkeleton({ label, accent = "violet" }: { label: string; accent?: "violet" | "amber" }) {
  const spin = accent === "amber" ? "border-amber-500/40 border-t-amber-500" : "border-violet-500/40 border-t-violet-500"
  return (
    <div className="bg-card/60 backdrop-blur-xl border border-border/70 shadow-xl rounded-2xl p-6">
      <div className="flex items-center gap-2.5 mb-5">
        <div className={`w-5 h-5 border-2 rounded-full animate-spin ${spin}`} />
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

type JDBlock =
  | { kind: "heading"; text: string }
  | { kind: "bullets"; items: string[] }
  | { kind: "para"; text: string }

function parseJobDescription(text: string): JDBlock[] {
  const blocks: JDBlock[] = []
  let para: string[] = []

  const flush = () => {
    if (para.length > 0) {
      blocks.push({ kind: "para", text: para.join(" ") })
      para = []
    }
  }

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim()
    if (!line) {
      flush()
      continue
    }

    const isBullet = /^[•·\-–*]\s+/.test(line) || /^\d+[.)]\s+/.test(line)
    const isHeading =
      (line.length <= 60 && line.endsWith(":")) ||
      (line.length <= 45 && line === line.toUpperCase() && /[A-Z]/.test(line))

    if (isBullet) {
      flush()
      const clean = line.replace(/^(?:[•·\-–*]|\d+[.)])\s*/, "")
      const last = blocks[blocks.length - 1]
      if (last && last.kind === "bullets") last.items.push(clean)
      else blocks.push({ kind: "bullets", items: [clean] })
      continue
    }

    if (isHeading) {
      flush()
      blocks.push({ kind: "heading", text: line.replace(/:$/, "") })
      continue
    }

    para.push(line)
  }

  flush()
  return blocks
}

function JobDescriptionBody({ text }: { text: string }) {
  const blocks = parseJobDescription(text)

  if (blocks.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-6 border border-dashed border-border/70 rounded-xl">
        No job description added yet.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {blocks.map((block, i) => {
        if (block.kind === "heading") {
          return (
            <h4 key={i} className="pt-1 text-[11px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-300">
              {block.text}
            </h4>
          )
        }
        if (block.kind === "bullets") {
          return (
            <ul key={i} className="space-y-1.5">
              {block.items.map((item, j) => (
                <li key={j} className="flex gap-2.5 text-[13px] leading-relaxed text-foreground/85">
                  <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500/60" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )
        }
        return (
          <p key={i} className="text-[13px] leading-relaxed text-muted-foreground">
            {block.text}
          </p>
        )
      })}
    </div>
  )
}


function AutoResizeTextarea({ value, onChange, className, minHeight = '48px', placeholder }: { value: string, onChange: (val: string) => void, className: string, minHeight?: string, placeholder?: string }) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px"
    }
  }, [value])

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={className}
      rows={1}
      style={{ minHeight, overflow: 'hidden' }}
      placeholder={placeholder}
    />
  )
}

const KEYWORD_GROUP = "Target Keywords"

type SkillEdit =
  | { type: "chip"; group: number; skill: number }
  | { type: "add"; group: number }
  | { type: "category"; group: number }

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
    const delay = lastScoredKeyRef.current === null ? 0 : 1000
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
  const allSkills = (resume.skills || []).flatMap((group) => group.skills || [])
  const matchedSkillCount = allSkills.filter(isSkillInJD).length
  const jdWordCount = jobDescription.trim() ? jobDescription.trim().split(/\s+/).length : 0
  const skillGroups = resume.skills || []

  // Click a missing keyword/skill in the analysis panels → add it to a dedicated group
  const handleAddKeyword = (keyword: string) => {
    const kw = keyword.trim()
    if (!kw || includesTerm(allSkills, kw)) return

    const groupIdx = skillGroups.findIndex(
      (g) => (g.category || "").trim().toLowerCase() === KEYWORD_GROUP.toLowerCase(),
    )

    if (groupIdx >= 0) {
      dispatch(updateSkillGroup({ index: groupIdx, skills: [...skillGroups[groupIdx].skills, kw] }))
    } else {
      dispatch(addSkillGroup({ category: KEYWORD_GROUP, skills: [kw] }))
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
    <div className="w-full max-w-7xl mx-auto pt-6 pb-8 animate-fade-in flex flex-col h-[calc(100dvh-9rem)] min-h-[620px]">
      <div className="flex flex-col gap-4 mb-5 shrink-0 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Optimize Your Resume</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Perfect your resume. Let our AI tailor your experience to match the exact requirements of your target role.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="lg"
            variant="outline"
            onClick={() => setShowHistory(!showHistory)}
            className={`rounded-full px-5 shadow-sm ${
              showHistory
                ? "border-violet-500/50 bg-violet-500/10 text-violet-600 dark:text-violet-300"
                : "border-border/70 text-foreground/80 hover:bg-muted/60"
            }`}
          >
            <History className="w-4 h-4 mr-2" />
            History
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={handleSaveVersion}
            className="rounded-full px-5 shadow-sm border-border/70 text-foreground/80 hover:bg-muted/60"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Version
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => setShowChatEditor(true)}
            className="rounded-full px-5 shadow-sm border-violet-500/40 text-violet-600 hover:bg-violet-500/10 dark:text-violet-300"
          >
            <Sparkles className="w-4 h-4 mr-2" /> Chat Edit
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => setShowCoverLetter(true)}
            className="rounded-full px-5 shadow-sm border-border/70 text-foreground/80 hover:bg-muted/60"
          >
            <FileText className="w-4 h-4 mr-2" /> Cover Letter
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => handleExport("classic")}
            className="rounded-full px-5 shadow-sm border-border/70 text-foreground/80 hover:bg-muted/60"
          >
            <Download className="w-4 h-4 mr-2" /> Classic PDF
          </Button>
          <Button
            size="lg"
            onClick={() => handleExport("modern")}
            className="rounded-full px-5 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all"
          >
            <Download className="w-4 h-4 mr-2" /> Modern PDF
          </Button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0 gap-4 lg:gap-6">
        {/* Main Workspace (Takes full width unless history is open) */}
        <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 min-h-0 pb-6 md:pb-0 overflow-y-auto md:overflow-hidden custom-scrollbar transition-all duration-300 ${showHistory ? 'hidden md:grid' : ''}`}>

          {/* Left Column: Parsed Data Edit Area */}
          <div className="md:col-span-2 space-y-6 md:overflow-y-auto md:pr-2 md:pb-6 custom-scrollbar">
            <div className="flex items-center gap-3" aria-hidden="true">
              <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                Your resume · edit anything
              </span>
              <span className="h-px flex-1 bg-border/70" />
            </div>

            {/* Summary Section */}
            <div className="relative group">
              {/* Ambient background glow that activates on hover or generation */}
              <div className={`absolute -inset-0.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-3xl blur opacity-15 group-hover:opacity-30 transition duration-500 ${isGenerating ? 'animate-pulse opacity-60' : ''}`}></div>

              <div className="relative bg-card/80 backdrop-blur-xl border border-border/60 rounded-3xl p-5 sm:p-6 shadow-xl">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center border border-violet-500/25">
                      <Sparkles className="w-4 h-4 text-violet-500" />
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

            {/* Experience Section */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-3xl blur opacity-10 group-hover:opacity-20 transition duration-500"></div>

              <div className="relative bg-card/80 backdrop-blur-xl border border-border/60 rounded-3xl p-5 sm:p-6 shadow-xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-fuchsia-500/20 to-violet-500/20 flex items-center justify-center border border-fuchsia-500/25">
                    <Briefcase className="w-4 h-4 text-fuchsia-500" />
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
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Skills Section */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-3xl blur opacity-10 group-hover:opacity-20 transition duration-500"></div>

              <div className="relative bg-card/80 backdrop-blur-xl border border-border/60 rounded-3xl p-5 sm:p-6 shadow-xl">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/20 to-violet-500/20 flex items-center justify-center border border-emerald-500/25">
                      <Layers className="w-4 h-4 text-emerald-500" />
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
          </div>

          {/* Right Column: Job Description & ATS Score */}
          <div className="flex flex-col gap-6 md:overflow-y-auto md:pb-6 custom-scrollbar">
            <div className="flex items-center gap-3" aria-hidden="true">
              <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                Live analysis
              </span>
              <span className="h-px flex-1 bg-border/70" />
            </div>

            {/* ATS Score Panel */}
            {isScoring && !atsData ? (
              <PanelSkeleton label="Analyzing ATS compatibility..." />
            ) : atsData ? (
              <div className="relative">
                {isScoring && (
                  <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-background/85 backdrop-blur-sm border border-border/60 rounded-full px-2.5 py-1">
                    <div className="w-3 h-3 border-2 border-violet-500/40 border-t-violet-500 rounded-full animate-spin" />
                    Updating...
                  </div>
                )}
                <ATSScorePanel
                  score={atsData.score}
                  matchingKeywords={atsData.matching_keywords}
                  missingKeywords={atsData.missing_keywords}
                  recommendations={atsData.recommendations}
                  skills={allSkills}
                  onAddKeyword={handleAddKeyword}
                />
              </div>
            ) : null}

            {/* Gap Analysis Panel */}
            {isGapLoading && !gapData ? (
              <PanelSkeleton label="Running gap analysis..." accent="amber" />
            ) : gapData ? (
              <div className="relative">
                {isGapLoading && (
                  <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-background/85 backdrop-blur-sm border border-border/60 rounded-full px-2.5 py-1">
                    <div className="w-3 h-3 border-2 border-amber-500/40 border-t-amber-500 rounded-full animate-spin" />
                    Updating...
                  </div>
                )}
                <GapAnalysisPanel
                  overallMatchPercent={gapData.overall_match_percent}
                  matchedSkills={gapData.matched_skills}
                  missingRequired={gapData.missing_required}
                  missingPreferred={gapData.missing_preferred}
                  relevantExperiences={gapData.relevant_experiences}
                  recommendations={gapData.recommendations}
                  skills={allSkills}
                  onAddKeyword={handleAddKeyword}
                />
              </div>
            ) : null}

            <div className="relative flex flex-col min-h-[220px] flex-1 overflow-hidden rounded-2xl border border-border/70 bg-card/60 shadow-lg backdrop-blur-xl">
              <div className="flex items-start justify-between gap-3 border-b border-border/60 p-4 sm:p-5 shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 shrink-0 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
                    <Target className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="leading-tight min-w-0">
                    <h3 className="font-semibold text-base">Target Job</h3>
                    <p className="text-xs text-muted-foreground truncate">What we optimize against</p>
                  </div>
                </div>
                <span className="shrink-0 rounded-full border border-border/60 bg-background/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                  {jdWordCount} {jdWordCount === 1 ? "word" : "words"}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 pb-8 custom-scrollbar">
                <JobDescriptionBody text={jobDescription} />
              </div>
              <div
                className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-card to-transparent"
                aria-hidden="true"
              />
            </div>
          </div>

        </div>

        {/* History Sidebar */}
        {showHistory && (
          <aside className="w-80 shrink-0 bg-card/80 backdrop-blur-xl border border-border/60 shadow-xl rounded-2xl p-5 flex flex-col animate-fade-in">
            <div className="flex items-center justify-between mb-4 shrink-0">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-violet-500" />
                <h3 className="font-bold text-base">Version History</h3>
              </div>
              {versions && versions.length > 0 && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {versions.length}
                </span>
              )}
            </div>
            <div className="overflow-y-auto custom-scrollbar -mr-2 pr-2">
              {!versions || versions.length === 0 ? (
                <div className="text-center py-8 px-2">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-muted flex items-center justify-center">
                    <FileText className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">No versions saved yet.</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    Save a version to compare different tailoring passes.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {versions.map((v: any) => (
                    <div key={v.version_id} className="p-4 bg-background/60 rounded-xl border border-border/60 hover:border-violet-500/40 hover:bg-background/80 transition-colors group">
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="font-semibold text-sm leading-snug">{v.label}</h4>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleLoadVersion(v)}
                          className="h-6 px-2 text-xs shrink-0 rounded-full opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
                        >
                          Restore
                        </Button>
                      </div>
                      <div className="flex justify-between items-center mt-2.5">
                        <span className="text-xs text-muted-foreground">{new Date(v.created_at).toLocaleDateString()}</span>
                        <span className="text-xs font-bold rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5">
                          ATS {v.ats_score}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>
        )}
      </div>

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
