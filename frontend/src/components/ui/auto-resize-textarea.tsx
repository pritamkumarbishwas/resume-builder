import { useRef, useEffect } from "react"

export function AutoResizeTextarea({
  value,
  onChange,
  className,
  minHeight = "48px",
  placeholder,
  onBlur,
}: {
  value: string
  onChange: (val: string) => void
  className: string
  minHeight?: string
  placeholder?: string
  onBlur?: () => void
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px"
    }
  }, [value])

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      className={className}
      rows={1}
      style={{ minHeight, overflow: "hidden" }}
      placeholder={placeholder}
    />
  )
}
