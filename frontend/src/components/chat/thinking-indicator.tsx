export function ThinkingIndicator() {
  return (
    <div className="flex gap-4 px-4 py-5 md:px-[74px] w-full max-w-3xl mx-auto">
      <div className="shrink-0 pt-0.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-end">
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-primary-foreground">
            <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729z" />
          </svg>
        </div>
      </div>
      <div className="flex items-center gap-2 pt-2">
        <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:0ms]" />
        <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:150ms]" />
        <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:300ms]" />
      </div>
    </div>
  )
}
