import { useState } from "react"
import { useAppDispatch } from "@/store/hooks"
import { setJobDescription, setStep } from "@/store/slices/resume-slice"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Briefcase, ArrowRight, ArrowLeft } from "lucide-react"

export function JobDescriptionView() {
  const dispatch = useAppDispatch()
  const [jd, setJd] = useState("")

  const handleNext = () => {
    if (!jd.trim()) return
    dispatch(setJobDescription(jd))
    dispatch(setStep("TAILOR"))
  }

  const handleBack = () => {
    dispatch(setStep("UPLOAD"))
  }

  return (
    <div className="w-full max-w-3xl mx-auto mt-12 animate-fade-in flex flex-col h-[80vh]">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-extrabold tracking-tight mb-2">Define Your Target Role</h2>
        <p className="text-muted-foreground">
          Paste the job description of your dream role. Our AI will analyze the key requirements to align your experience perfectly.
        </p>
      </div>

      <div className="flex-1 bg-card/50 backdrop-blur-xl border border-border shadow-2xl rounded-3xl p-6 flex flex-col relative overflow-hidden">
        {/* Decorative background blur */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-fuchsia-500/10 blur-3xl rounded-full pointer-events-none" />

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-fuchsia-500/20 rounded-full flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-fuchsia-400" />
          </div>
          <h3 className="font-semibold text-lg">Job Details</h3>
        </div>

        <Textarea
          value={jd}
          onChange={(e) => setJd(e.target.value)}
          placeholder="Paste the complete job description here..."
          className="flex-1 resize-none bg-background/50 border-border/50 focus:border-fuchsia-500/50 rounded-2xl p-6 text-base shadow-inner"
        />

        <div className="mt-6 flex items-center justify-between">
          <Button variant="ghost" onClick={handleBack} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <Button
            size="lg"
            onClick={handleNext}
            disabled={!jd.trim()}
            className="rounded-full px-8 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white shadow-lg transition-all"
          >
            Analyze & Optimize <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-3 gap-6 text-center text-sm text-muted-foreground">
        <div className="flex flex-col items-center gap-2 opacity-50">
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">✓</div>
          <p>Profile Uploaded</p>
        </div>
        <div className="flex flex-col items-center gap-2 text-foreground font-medium">
          <div className="w-10 h-10 rounded-full bg-violet-500/20 text-violet-400 border border-violet-500/30 flex items-center justify-center">2</div>
          <p>Set Target Role</p>
        </div>
        <div className="flex flex-col items-center gap-2 opacity-50">
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">3</div>
          <p>Optimize & Export</p>
        </div>
      </div>
    </div>
  )
}
