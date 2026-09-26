import { useRef, useState } from "react"
import { UploadCloud, AlertTriangle } from "lucide-react"
import { useUploadResumeMutation } from "@/store/api/resume-api"
import { setResume, setStep } from "@/store/slices/resume-slice"
import { useAppDispatch } from "@/store/hooks"
import { Button } from "@/components/ui/button"

const STEPS = ["Upload Profile", "Set Target Role", "Optimize & Export"]

export function UploadView() {
  const [isDragging, setIsDragging] = useState(false)
  const [uploadResume, { isLoading, error }] = useUploadResumeMutation()
  const dispatch = useAppDispatch()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".docx")) {
      alert("Please upload a PDF or DOCX file.")
      return
    }

    try {
      const parsedResume = await uploadResume(file).unwrap()
      dispatch(setResume(parsedResume))
      dispatch(setStep("JOB_DESC"))
    } catch (err) {
      console.error("Upload failed", err)
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto pt-12 pb-16 md:pt-16 animate-fade-in">
      <div className="text-center mb-8">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/25 bg-violet-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-300">
          Step 1 of 3
        </span>
        <h1 className="mt-4 text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-3 bg-gradient-to-r from-violet-600 via-violet-500 to-fuchsia-500 text-transparent bg-clip-text">
          Transform Your Resume
        </h1>
        <p className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
          Upload your existing resume. Our AI will analyze your experience and precision-tailor it
          for your target role.
        </p>
      </div>

      <div
        className={`relative border-2 border-dashed rounded-3xl px-6 py-10 sm:px-12 sm:py-12 flex flex-col items-center justify-center transition-all duration-300 ${
          isDragging
            ? "border-violet-500 bg-violet-500/10 scale-[1.01] shadow-xl shadow-violet-500/10"
            : "border-border bg-card/60 hover:border-violet-500/60 hover:bg-card hover:shadow-xl hover:shadow-violet-500/5"
        } backdrop-blur-xl shadow-lg`}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setIsDragging(false)
          const file = e.dataTransfer.files?.[0]
          if (file) handleFile(file)
        }}
      >
        <div
          className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-6 border transition-colors ${
            isDragging
              ? "bg-violet-500/25 border-violet-500/40"
              : "bg-gradient-to-br from-violet-500/15 to-fuchsia-500/15 border-violet-500/20"
          }`}
        >
          <UploadCloud className={`w-10 h-10 ${isDragging ? "text-violet-600 dark:text-violet-300" : "text-violet-500"}`} />
        </div>

        <h3 className="text-lg sm:text-xl font-semibold mb-1.5 text-center">
          Drag &amp; drop your resume here
        </h3>
        <p className="text-sm text-muted-foreground mb-6 text-center">
          PDF or DOCX · one file, that&apos;s it
        </p>

        <input
          type="file"
          accept=".pdf,.docx"
          className="hidden"
          ref={fileInputRef}
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFile(file)
          }}
        />

        <div className="flex flex-col items-center gap-3">
          <Button
            size="lg"
            className="rounded-full px-8 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 mr-2 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Analyzing Profile...
              </>
            ) : (
              "Browse files"
            )}
          </Button>
          <span className="text-xs text-muted-foreground">or drop it anywhere in this box</span>
        </div>

        {error && (
          <p
            role="alert"
            className="mt-6 flex items-center gap-2 text-sm font-medium text-destructive bg-destructive/10 border border-destructive/20 px-4 py-2 rounded-full"
          >
            <AlertTriangle className="w-4 h-4 shrink-0" />
            We couldn&apos;t read that file. Please try another PDF or DOCX.
          </p>
        )}
      </div>

      {/* Progress strip */}
      <div className="relative mt-12">
        <div className="absolute left-[16.66%] right-[16.66%] top-5 h-px bg-border" aria-hidden="true" />
        <ol className="relative grid grid-cols-3 gap-2 text-center text-xs sm:text-sm">
          {STEPS.map((label, i) => {
            const isActive = i === 0
            return (
              <li key={label} className="flex flex-col items-center gap-2">
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold ${
                    isActive
                      ? "border-transparent bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-md shadow-violet-500/30"
                      : "border-border bg-card text-muted-foreground"
                  }`}
                >
                  {i + 1}
                </span>
                <span className={isActive ? "font-semibold text-foreground" : "text-muted-foreground"}>
                  {label}
                </span>
              </li>
            )
          })}
        </ol>
      </div>
    </div>
  )
}
