import { Check, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { TemplateInfo } from "@/store/api/resume-api"

const FALLBACK_TEMPLATES: TemplateInfo[] = [
  {
    id: "classic",
    name: "Classic",
    description: "Traditional centered layout with ruled section headings.",
    preview: { accent: "111111", font: "Helvetica", layout: "Centered header" },
    is_default: true,
  },
  {
    id: "modern",
    name: "Modern",
    description: "Left-aligned header with a colour accent bar.",
    preview: { accent: "5A67D8", font: "Open Sans", layout: "Accent bar header" },
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Plain single-column — maximum ATS parsability.",
    preview: { accent: "444444", font: "Arial", layout: "Plain single column" },
  },
]

interface TemplatePickerProps {
  templates?: TemplateInfo[]
  value: string
  onChange: (id: string) => void
}

export function TemplatePicker({ templates, value, onChange }: TemplatePickerProps) {
  const list = templates && templates.length > 0 ? templates : FALLBACK_TEMPLATES
  const current = list.find((t) => t.id === value) ?? list[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          aria-label={`Template: ${current.name}. Click to change`}
          className="rounded-full border-border/70 px-3.5 text-foreground/80 hover:bg-muted/60"
        >
          <span
            className="mr-2 h-3 w-3 rounded-full border border-border/60"
            style={{ backgroundColor: `#${current.preview.accent}` }}
          />
          {current.name}
          <ChevronDown className="ml-1.5 h-3.5 w-3.5 opacity-60" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[19rem] p-1.5">
        <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-muted-foreground">
          Resume template
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {list.map((t) => (
          <DropdownMenuItem
            key={t.id}
            onSelect={() => onChange(t.id)}
            className="cursor-pointer items-start gap-3 py-2.5"
          >
            {/* Mini page preview: accent header + text lines */}
            <span
              className="mt-0.5 block h-10 w-7 shrink-0 overflow-hidden rounded-sm border border-border/60 bg-white shadow-sm"
              aria-hidden="true"
            >
              <span
                className="block h-2 w-full"
                style={{ backgroundColor: `#${t.preview.accent}` }}
              />
              <span className="mx-1 mt-1.5 block h-1 w-5 rounded-full bg-neutral-300" />
              <span className="mx-1 mt-1 block h-1 w-4 rounded-full bg-neutral-200" />
              <span className="mx-1 mt-1 block h-1 w-5 rounded-full bg-neutral-200" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5 text-sm font-semibold">
                {t.name}
                {value === t.id && <Check className="h-3.5 w-3.5 text-primary" aria-hidden="true" />}
              </span>
              <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">
                {t.description}
              </span>
              <span className="mt-1 block text-[10px] text-muted-foreground/80">
                {t.preview.layout} · {t.preview.font}
              </span>
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
