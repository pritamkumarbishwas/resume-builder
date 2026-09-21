import { useAppSelector } from "@/store/hooks"
import { UploadView } from "@/components/builder/UploadView"
import { JobDescriptionView } from "@/components/builder/JobDescriptionView"
import { TailorView } from "@/components/builder/TailorView"
import { Sparkles } from "lucide-react"

export default function App() {
  const step = useAppSelector((state) => state.resume.step)

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-fuchsia-500/30">
      
      {/* Premium Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/60 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center px-4 md:px-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight">AI Resume Builder</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 container mx-auto px-4 md:px-8 relative">
        {/* Background ambient glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-64 bg-violet-500/10 blur-[100px] pointer-events-none rounded-full" />
        
        <div className="relative z-10">
          {step === "UPLOAD" && <UploadView />}
          {step === "JOB_DESC" && <JobDescriptionView />}
          {step === "TAILOR" && <TailorView />}
        </div>
      </main>
      
    </div>
  )
}
