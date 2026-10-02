import { Button } from "@/components/ui/button"
import { AlertTriangle, X } from "lucide-react"

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
  variant?: "default" | "destructive"
}

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  variant = "default",
}: ConfirmDialogProps) {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/70 backdrop-blur-sm animate-fade-in"
      onClick={onCancel}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-desc"
        className="bg-card w-full max-w-sm rounded-3xl shadow-2xl border border-border/70 animate-slide-up overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-border/60 bg-muted/25">
          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 shrink-0 rounded-xl flex items-center justify-center border ${
                variant === "destructive"
                  ? "bg-destructive/10 border-destructive/25 text-destructive"
                  : "bg-amber-500/10 border-amber-500/25 text-amber-600"
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
            </div>
            <h2 id="confirm-title" className="text-base font-bold">
              {title}
            </h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onCancel}
            className="rounded-full shrink-0 text-muted-foreground hover:text-foreground"
            aria-label="Cancel"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          <p id="confirm-desc" className="text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>
          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={onCancel} className="rounded-full px-5">
              {cancelLabel}
            </Button>
            <Button
              type="button"
              onClick={onConfirm}
              className={`rounded-full px-5 text-white ${
                variant === "destructive"
                  ? "bg-destructive hover:bg-destructive/90"
                  : "bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500"
              }`}
            >
              {confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
