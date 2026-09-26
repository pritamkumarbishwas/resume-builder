import { useAppSelector } from "@/store/hooks"
import { UploadView } from "@/components/builder/UploadView"
import { JobDescriptionView } from "@/components/builder/JobDescriptionView"
import { TailorView } from "@/components/builder/TailorView"
import { Sparkles, Check } from "lucide-react"

const STEPS = [
  { key: "UPLOAD", label: "Upload resume" },
  { key: "JOB_DESC", label: "Target role" },
  { key: "TAILOR", label: "Optimize & export" },
] as const

export default function App() {
  const step = useAppSelector((state) => state.resume.step)
  const activeIndex = STEPS.findIndex((s) => s.key === step)
  const current = STEPS[activeIndex]

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* App header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 md:px-6">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 shadow-lg shadow-violet-500/30">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div className="leading-tight">
              <span className="block text-[15px] font-bold tracking-tight">AI Resume Builder</span>
              <span className="hidden text-xs text-muted-foreground sm:block">
                Tailor, score and export in one place
              </span>
            </div>
          </div>

          {/* Desktop stepper */}
          <ol className="hidden items-center md:flex" aria-label="Setup progress">
            {STEPS.map((s, i) => {
              const isDone = activeIndex > -1 && i < activeIndex
              const isCurrent = i === activeIndex
              return (
                <li key={s.key} className="flex items-center" aria-current={isCurrent ? "step" : undefined}>
                  {i > 0 && (
                    <span
                      className={`mx-1 h-px w-4 lg:w-8 ${isDone || isCurrent ? "bg-violet-500/60" : "bg-border"}`}
                      aria-hidden="true"
                    />
                  )}
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold transition-colors ${
                      isCurrent
                        ? "border-transparent bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-md shadow-violet-500/30"
                        : isDone
                          ? "border-violet-500/40 bg-violet-500/10 text-violet-600 dark:text-violet-300"
                          : "border-border bg-card text-muted-foreground"
                    }`}
                  >
                    {isDone ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : i + 1}
                  </span>
                  <span
                    className={`ml-2 text-[13px] ${
                      isCurrent ? "font-semibold text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {s.label}
                  </span>
                </li>
              )
            })}
          </ol>

          {/* Mobile progress pill */}
          <span className="rounded-full border border-border/60 bg-card/70 px-3 py-1.5 text-xs font-medium text-muted-foreground md:hidden">
            Step {activeIndex > -1 ? activeIndex + 1 : 1} of {STEPS.length}
            {current ? ` · ${current.label}` : ""}
          </span>
        </div>
      </header>

      {/* Main content area */}
      <main className="relative flex-1 w-full max-w-7xl mx-auto px-4 md:px-6">
        {/* Background ambient glow */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-72 bg-violet-500/10 dark:bg-violet-500/[0.07] blur-[110px] pointer-events-none rounded-full"
          aria-hidden="true"
        />

        <div className="relative z-10">
          {step === "UPLOAD" && <UploadView />}
          {step === "JOB_DESC" && <JobDescriptionView />}
          {step === "TAILOR" && <TailorView />}
        </div>
      </main>
    </div>
  )
}
