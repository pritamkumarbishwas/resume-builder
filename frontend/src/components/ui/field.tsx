import type { ChangeEvent } from "react"

interface FieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  placeholder?: string
  hint?: string
  className?: string
}

export function Field({ label, value, onChange, onBlur, placeholder, hint, className = "" }: FieldProps) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <input
        type="text"
        value={value}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        className="w-full rounded-lg border border-border/60 bg-background/50 px-3 py-2 text-sm text-foreground outline-none transition-colors hover:border-border focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20 placeholder:text-muted-foreground/70"
      />
      {hint ? <span className="mt-1 block text-[11px] text-muted-foreground/70">{hint}</span> : null}
    </label>
  )
}
