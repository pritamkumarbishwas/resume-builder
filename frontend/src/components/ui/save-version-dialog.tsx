import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Save, X } from "lucide-react"

interface SaveVersionDialogProps {
  isOpen: boolean
  onClose: () => void
  onSave: (label: string) => void
  isSaving: boolean
}

export function SaveVersionDialog({ isOpen, onClose, onSave, isSaving }: SaveVersionDialogProps) {
  const [label, setLabel] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  // Reset and focus when opened
  useEffect(() => {
    if (isOpen) {
      setLabel("")
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = label.trim()
    if (!trimmed || trimmed.length > 120) return
    onSave(trimmed)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/70 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="save-version-title"
        className="bg-card w-full max-w-sm rounded-3xl shadow-2xl border border-border/70 animate-slide-up overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-border/60 bg-muted/25">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 shrink-0 rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-500/25 flex items-center justify-center">
              <Save className="w-4 h-4 text-violet-500" />
            </div>
            <h2 id="save-version-title" className="text-base font-bold">
              Save Version
            </h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full shrink-0 text-muted-foreground hover:text-foreground"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="version-label" className="text-sm font-medium text-muted-foreground">
              Version label
            </label>
            <Input
              id="version-label"
              ref={inputRef}
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder='e.g. "Tailored for Google SWE"'
              maxLength={120}
              className="h-10 bg-background/60"
            />
            <p className="text-xs text-muted-foreground text-right">{label.length}/120</p>
          </div>

          <div className="flex gap-3 justify-end pt-1">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-full px-5">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!label.trim() || isSaving}
              className="rounded-full px-5 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white"
            >
              {isSaving ? (
                <>
                  <span className="w-3.5 h-3.5 mr-2 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5 mr-2" />
                  Save
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
