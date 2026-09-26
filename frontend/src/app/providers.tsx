import { Provider } from "react-redux"
import { TooltipProvider } from "@/components/ui/tooltip"
import { store } from "@/store"
import type { ReactNode } from "react"
import { Component } from "react"

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background text-foreground px-4">
          <div className="w-full max-w-md rounded-3xl border border-border/70 bg-card/70 backdrop-blur-xl p-8 text-center shadow-xl">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 border border-destructive/20 text-xl font-extrabold text-destructive">
              !
            </div>
            <h1 className="text-xl font-semibold mb-2">Something went wrong</h1>
            <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
              {this.state.error?.message || "An unexpected error occurred."}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-2.5 text-sm font-medium text-white shadow-lg shadow-violet-500/25 transition-all hover:from-violet-500 hover:to-fuchsia-500"
            >
              Reload page
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <Provider store={store}>
      <TooltipProvider delayDuration={300}>
        <ErrorBoundary>{children}</ErrorBoundary>
      </TooltipProvider>
    </Provider>
  )
}
