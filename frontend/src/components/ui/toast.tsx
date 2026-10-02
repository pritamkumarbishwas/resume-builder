import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react"
import { CheckCircle, XCircle, Info, X } from "lucide-react"

type ToastVariant = "success" | "error" | "info"

interface ToastItem {
  id: number
  message: string
  variant: ToastVariant
}

interface ToastContextValue {
  toast: (message: string, variant?: ToastVariant) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

let _idCounter = 0

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map())

  const dismiss = useCallback((id: number) => {
    clearTimeout(timers.current.get(id))
    timers.current.delete(id)
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback(
    (message: string, variant: ToastVariant = "info") => {
      const id = ++_idCounter
      setToasts((prev) => [...prev.slice(-4), { id, message, variant }]) // max 5 at once
      const timer = setTimeout(() => dismiss(id), 4000)
      timers.current.set(id, timer)
    },
    [dismiss],
  )

  // Cleanup all timers on unmount
  useEffect(() => {
    return () => timers.current.forEach((t) => clearTimeout(t))
  }, [])

  const icons: Record<ToastVariant, React.ReactNode> = {
    success: <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" />,
    error: <XCircle className="h-4 w-4 shrink-0 text-destructive" />,
    info: <Info className="h-4 w-4 shrink-0 text-violet-500" />,
  }

  const styles: Record<ToastVariant, string> = {
    success: "border-emerald-500/25 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100",
    error: "border-destructive/25 bg-destructive/10 text-destructive",
    info: "border-violet-500/25 bg-violet-500/10 text-foreground",
  }

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast container — bottom-right, above everything */}
      <div
        aria-live="polite"
        aria-label="Notifications"
        className="pointer-events-none fixed bottom-5 right-5 z-[100] flex flex-col gap-2"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto flex w-80 max-w-[calc(100vw-2.5rem)] items-start gap-3 rounded-2xl border px-4 py-3 shadow-lg backdrop-blur-xl transition-all animate-fade-in ${styles[t.variant]}`}
          >
            {icons[t.variant]}
            <p className="flex-1 text-sm leading-snug">{t.message}</p>
            <button
              onClick={() => dismiss(t.id)}
              className="mt-px rounded p-0.5 opacity-60 transition hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
              aria-label="Dismiss"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>")
  return ctx
}
