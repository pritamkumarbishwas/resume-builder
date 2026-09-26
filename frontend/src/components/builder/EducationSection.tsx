import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { updateEducation, addEducation, removeEducation, type Education } from "@/store/slices/resume-slice"
import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { GraduationCap, Plus, X } from "lucide-react"

export function EducationSection() {
  const dispatch = useAppDispatch()
  const resume = useAppSelector((state) => state.resume.resume)
  const education: Education[] = resume?.education || []

  const patchEducation = (index: number, changes: Partial<Education>) => {
    const entry = education[index]
    if (!entry) return
    dispatch(updateEducation({ index, education: { ...entry, ...changes } }))
  }

  return (
    <div className="relative group">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-3xl blur opacity-10 group-hover:opacity-20 transition duration-500"></div>

      <div className="relative bg-card/80 backdrop-blur-xl border border-border/60 rounded-3xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-fuchsia-500/20 to-violet-500/20 flex items-center justify-center border border-fuchsia-500/25">
              <GraduationCap className="w-4 h-4 text-fuchsia-500" />
            </div>
            <div className="leading-tight">
              <h3 className="text-lg font-bold">Education</h3>
              <p className="text-xs text-muted-foreground">Degrees, institutions and honors</p>
            </div>
          </div>
          <span className="rounded-full border border-border/60 bg-background/60 px-2.5 py-1 text-xs font-medium text-muted-foreground">
            {education.length} {education.length === 1 ? "entry" : "entries"}
          </span>
        </div>

        <div className="space-y-6">
          {education.length === 0 && (
            <div className="text-center py-8 border border-dashed border-border/70 rounded-2xl">
              <p className="text-sm text-muted-foreground mb-4">
                No education entries yet.
              </p>
              <Button size="sm" variant="outline" className="rounded-full" onClick={() => dispatch(addEducation())}>
                <Plus className="w-4 h-4 mr-2" /> Add education
              </Button>
            </div>
          )}

          {education.map((entry, idx) => (
            <div
              key={idx}
              className="border border-border/50 bg-background/40 hover:bg-background/70 rounded-2xl p-5 sm:p-6 relative overflow-hidden group/card transition-colors duration-300"
            >
              <div
                className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-fuchsia-500/60 to-violet-500/60 opacity-0 group-hover/card:opacity-100 transition-opacity"
                aria-hidden="true"
              />

              <div className="flex items-start justify-between gap-3">
                <div className="grid flex-1 gap-3 sm:grid-cols-3">
                  <Field
                    className="sm:col-span-3"
                    label="Degree"
                    value={entry.degree || ""}
                    onChange={(v) => patchEducation(idx, { degree: v })}
                    placeholder="e.g. B.S. Computer Science"
                  />
                  <Field
                    className="sm:col-span-3"
                    label="Institution"
                    value={entry.institution || ""}
                    onChange={(v) => patchEducation(idx, { institution: v })}
                    placeholder="e.g. University of Michigan"
                  />
                  <Field
                    label="Graduation date"
                    value={entry.graduation_date || ""}
                    onChange={(v) => patchEducation(idx, { graduation_date: v })}
                    placeholder="e.g. May 2020"
                  />
                  <Field
                    label="Location"
                    value={entry.location || ""}
                    onChange={(v) => patchEducation(idx, { location: v })}
                    placeholder="e.g. Ann Arbor, MI"
                  />
                  <Field
                    label="GPA"
                    value={entry.gpa || ""}
                    onChange={(v) => patchEducation(idx, { gpa: v })}
                    placeholder="e.g. 3.8/4.0"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => dispatch(removeEducation({ index: idx }))}
                  className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 opacity-100 md:opacity-0 md:group-hover/card:opacity-100"
                  aria-label={`Remove ${entry.degree || "education entry"}`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {education.length > 0 && (
            <button
              type="button"
              onClick={() => dispatch(addEducation())}
              className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-border/70 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-violet-500/50 hover:text-violet-600 dark:hover:text-violet-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            >
              <Plus className="w-3.5 h-3.5" /> Add education
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
