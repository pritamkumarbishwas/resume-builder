import { useState } from "react"
import { ChevronDown, Target } from "lucide-react"
import { cn } from "@/lib/utils"

type JDBlock =
  | { kind: "heading"; text: string }
  | { kind: "bullets"; items: string[] }
  | { kind: "para"; text: string }

function parseJobDescription(text: string): JDBlock[] {
  const blocks: JDBlock[] = []
  let para: string[] = []

  const flush = () => {
    if (para.length > 0) {
      blocks.push({ kind: "para", text: para.join(" ") })
      para = []
    }
  }

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim()
    if (!line) {
      flush()
      continue
    }

    const isBullet = /^[•·\-–*]\s+/.test(line) || /^\d+[.)]\s+/.test(line)
    const isHeading =
      (line.length <= 60 && line.endsWith(":")) ||
      (line.length <= 45 && line === line.toUpperCase() && /[A-Z]/.test(line))

    if (isBullet) {
      flush()
      const clean = line.replace(/^(?:[•·\-–*]|\d+[.)])\s*/, "")
      const last = blocks[blocks.length - 1]
      if (last && last.kind === "bullets") last.items.push(clean)
      else blocks.push({ kind: "bullets", items: [clean] })
      continue
    }

    if (isHeading) {
      flush()
      blocks.push({ kind: "heading", text: line.replace(/:$/, "") })
      continue
    }

    para.push(line)
  }

  flush()
  return blocks
}

function JobDescriptionBody({ text }: { text: string }) {
  const blocks = parseJobDescription(text)

  if (blocks.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border/70 px-3 py-6 text-center text-sm text-muted-foreground">
        No job description added yet.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {blocks.map((block, i) => {
        if (block.kind === "heading") {
          return (
            <h4 key={i} className="pt-1 text-[11px] font-bold uppercase tracking-wider text-primary">
              {block.text}
            </h4>
          )
        }
        if (block.kind === "bullets") {
          return (
            <ul key={i} className="space-y-1.5">
              {block.items.map((item, j) => (
                <li key={j} className="flex gap-2.5 text-[13px] leading-relaxed text-foreground/85">
                  <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )
        }
        return (
          <p key={i} className="text-[13px] leading-relaxed text-muted-foreground">
            {block.text}
          </p>
        )
      })}
    </div>
  )
}

interface JobDescriptionCardProps {
  text: string
}

export function JobDescriptionCard({ text }: JobDescriptionCardProps) {
  const [open, setOpen] = useState(false)
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0

  return (
    <section
      aria-label="Target job description"
      className="rounded-2xl border border-border/60 bg-card shadow-sm"
    >
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-controls="target-job-body"
        className="flex w-full items-center justify-between gap-3 p-4 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 rounded-2xl"
      >
        <span className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-primary/25 bg-primary/10">
            <Target className="h-4 w-4 text-primary" aria-hidden="true" />
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block text-sm font-semibold">Target Job</span>
            <span className="block truncate text-xs text-muted-foreground">What we optimize against</span>
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-2">
          <span className="rounded-full border border-border/60 bg-background/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
            {wordCount} {wordCount === 1 ? "word" : "words"}
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform duration-200",
              open && "rotate-180"
            )}
            aria-hidden="true"
          />
        </span>
      </button>

      <div id="target-job-body" hidden={!open} className="border-t border-border/60 p-4 sm:p-5">
        <JobDescriptionBody text={text} />
      </div>
    </section>
  )
}
