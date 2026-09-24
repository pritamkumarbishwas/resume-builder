import { useRef, useState } from "react"
import { UploadCloud } from "lucide-react"
import { useUploadResumeMutation } from "@/store/api/resume-api"
import { setResume, setStep } from "@/store/slices/resume-slice"
import { useAppDispatch } from "@/store/hooks"
import { Button } from "@/components/ui/button"

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
    <div className="w-full max-w-2xl mx-auto mt-20 animate-fade-in">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-extrabold tracking-tight mb-2 bg-gradient-to-r from-violet-400 to-fuchsia-500 text-transparent bg-clip-text">
          Transform Your Resume
        </h1>
        <p className="text-muted-foreground text-lg">
          Upload your existing resume. Our AI will analyze your experience and precision-tailor it for your target role.
        </p>
      </div>

      <div
        className={`relative border-2 border-dashed rounded-3xl p-12 flex flex-col items-center justify-center transition-all duration-300 ${isDragging
            ? "border-violet-500 bg-violet-500/10 scale-[1.02]"
            : "border-border bg-card/50 hover:border-violet-500/50 hover:bg-card"
          } backdrop-blur-xl shadow-2xl`}
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
        <div className="w-20 h-20 bg-violet-500/20 rounded-full flex items-center justify-center mb-6">
          <UploadCloud className="w-10 h-10 text-violet-400" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Drag & drop your resume here</h3>
        <p className="text-sm text-muted-foreground mb-6">Supports PDF and DOCX formats</p>

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

        <Button
          size="lg"
          className="rounded-full px-8 bg-violet-600 hover:bg-violet-700 text-white shadow-lg hover:shadow-violet-500/25 transition-all"
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
        >
          {isLoading ? "Analyzing Profile..." : "Upload Resume"}
        </Button>

        {error && (
          <p className="text-destructive mt-4 text-sm font-medium bg-destructive/10 px-3 py-1 rounded-full">
            Something went wrong parsing your file.
          </p>
        )}
      </div>

      <div className="mt-12 grid grid-cols-3 gap-6 text-center text-sm text-muted-foreground">
        <div className="flex flex-col items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">1</div>
          <p>Upload Profile</p>
        </div>
        <div className="flex flex-col items-center gap-2 opacity-50">
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">2</div>
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
