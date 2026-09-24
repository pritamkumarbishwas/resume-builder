import { useState, useRef, useEffect, useCallback } from "react"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import {
  useRewriteBulletsMutation,
  useGenerateSummaryMutation,
  useGetAtsScoreMutation
} from "@/store/api/resume-api"
import { API_BASE_URL } from "@/store/api/resume-api"
import { updateExperienceBullets, updateSummary } from "@/store/slices/resume-slice"
import { Button } from "@/components/ui/button"
import { Sparkles, Download, CheckCircle2, Briefcase, Copy, Check, FileText } from "lucide-react"
import { ATSScorePanel } from "./ATSScorePanel"
import { CoverLetterModal } from "./CoverLetterModal"

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
  const [showCoverLetter, setShowCoverLetter] = useState(false)

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

  const handleExport = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/export/pdf`, {
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

  return (
    <div className="w-full max-w-7xl mx-auto mt-6 animate-fade-in flex flex-col h-[90vh]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">Optimize Your Resume</h2>
          <p className="text-muted-foreground">Perfect your resume. Let our AI tailor your experience to match the exact requirements of your target role.</p>
        </div>
        <div className="flex gap-3">
          <Button
            size="lg"
            variant="outline"
            onClick={() => setShowCoverLetter(true)}
            className="rounded-full px-6 shadow-sm border-border/50 hover:bg-muted/50"
          >
            <FileText className="w-4 h-4 mr-2" /> Cover Letter
          </Button>
          <Button
            size="lg"
            onClick={handleExport}
            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg rounded-full px-6"
          >
            <Download className="w-4 h-4 mr-2" /> Download Resume
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 min-h-0">

        {/* Left Column: Parsed Data Edit Area */}
        <div className="md:col-span-2 space-y-6 overflow-y-auto pr-2 pb-20 custom-scrollbar">

          {/* Summary Section */}
          <div className="relative group">
            {/* Ambient background glow that activates on hover or generation */}
            <div className={`absolute -inset-0.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-500 ${isGenerating ? 'animate-pulse opacity-60' : ''}`}></div>

            <div className="relative bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center border border-violet-500/30">
                    <Sparkles className="w-4 h-4 text-violet-400" />
                  </div>
                  <h3 className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                    Executive Summary
                  </h3>
                </div>

                <Button
                  variant="default"
                  size="sm"
                  onClick={handleGenerateSummary}
                  disabled={isGenerating}
                  className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white shadow-lg shadow-violet-500/25 rounded-full px-5 transition-all"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-4 h-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
                  className="w-full bg-background/40 border border-border/40 hover:bg-black/5 hover:dark:bg-white/5 focus:bg-background focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 rounded-xl p-5 text-base leading-relaxed resize-none transition-all outline-none"
                  placeholder="Click 'Generate with AI' to let our agent craft a compelling professional summary perfectly tailored to your target role..."
                  minHeight="140px"
                />
              </div>
            </div>
          </div>

          {/* Experience Section */}
          <div className="relative group mt-8">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-3xl blur opacity-10 group-hover:opacity-20 transition duration-500"></div>

            <div className="relative bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-full bg-fuchsia-500/20 flex items-center justify-center border border-fuchsia-500/30">
                  <Briefcase className="w-4 h-4 text-fuchsia-400" />
                </div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  Work Experience
                </h3>
              </div>

              <div className="space-y-6">
                {(resume.experiences || []).map((exp, idx) => (
                  <div key={idx} className="border border-border/40 bg-background/40 hover:bg-background/60 rounded-xl p-6 relative overflow-hidden group/card transition-colors duration-300">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-bold text-lg text-foreground/90">{exp.title}</h4>
                        <div className="flex items-center text-sm text-muted-foreground gap-2 mt-1">
                          <span className="font-medium text-violet-400/90">{exp.company}</span>
                          <span className="opacity-50">•</span>
                          <span>{exp.start_date} - {exp.end_date || "Present"}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover/card:opacity-100 transition-all duration-300 transform group-hover/card:translate-x-0 translate-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCopyExperience(idx, exp)}
                          className="rounded-full border-border/50 hover:bg-background/80 shadow-sm"
                        >
                          {copiedExpIndex === idx ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleRewriteBullets(idx, exp.description)}
                          disabled={isRewriting && activeExpIndex === idx}
                          className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white shadow-md shadow-violet-500/20 rounded-full"
                        >
                          {isRewriting && activeExpIndex === idx ? (
                            <>
                              <div className="w-3 h-3 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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

                    <div className="space-y-3 mt-5">
                      {(exp.description || []).map((bullet, bIdx) => (
                        <div key={bIdx} className="flex gap-4 items-start group/bullet relative">
                          {/* Perfectly aligned, modern bullet point */}
                          <div className="mt-[9px] w-2 h-2 rounded-full border border-fuchsia-500/50 bg-fuchsia-500/20 shrink-0 group-hover/bullet:bg-fuchsia-500 group-hover/bullet:border-fuchsia-500 group-hover/bullet:shadow-[0_0_12px_rgba(217,70,239,0.7)] group-hover/bullet:scale-125 transition-all duration-300" />

                          <AutoResizeTextarea
                            value={bullet}
                            onChange={(newVal) => {
                              const newBullets = [...exp.description]
                              newBullets[bIdx] = newVal
                              dispatch(updateExperienceBullets({ index: idx, bullets: newBullets }))
                            }}
                            className="w-full text-sm bg-transparent border border-transparent hover:bg-black/5 hover:dark:bg-white/5 focus:bg-background focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 resize-none py-1.5 px-3 -ml-3 rounded-md transition-all text-foreground/90 outline-none leading-relaxed"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Job Description & ATS Score */}
        <div className="flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-2 pb-20">

          {/* ATS Score Panel */}
          {isScoring && !atsData ? (
            <div className="bg-card/30 backdrop-blur-xl border border-border shadow-xl rounded-2xl p-6 flex flex-col items-center justify-center h-48 animate-pulse">
              <div className="w-8 h-8 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mb-4" />
              <p className="text-sm font-medium text-muted-foreground">Analyzing ATS Compatibility...</p>
            </div>
          ) : atsData ? (
            <div className="relative">
              {isScoring && (
                <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 text-xs text-muted-foreground bg-background/80 backdrop-blur-sm border border-border/50 rounded-full px-2.5 py-1">
                  <div className="w-3 h-3 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
                  Updating...
                </div>
              )}
              <ATSScorePanel
                score={atsData.score}
                matchingKeywords={atsData.matching_keywords}
                missingKeywords={atsData.missing_keywords}
                recommendations={atsData.recommendations}
              />
            </div>
          ) : null}

          <div className="bg-card/30 backdrop-blur-xl border border-border rounded-2xl p-6 flex flex-col min-h-0 shadow-inner flex-1">
            <div className="flex items-center gap-2 mb-4 shrink-0">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <h3 className="font-semibold text-lg">Target Job</h3>
            </div>
            <div className="overflow-y-auto custom-scrollbar text-sm text-muted-foreground pr-2 pb-4 whitespace-pre-wrap">
              {jobDescription}
            </div>
          </div>
        </div>

      </div>

      <CoverLetterModal
        isOpen={showCoverLetter}
        onClose={() => setShowCoverLetter(false)}
        resume={resume}
        jobDescription={jobDescription}
      />
    </div>
  )
}
