import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { updateProject, addProject, removeProject, type Project } from "@/store/slices/resume-slice"
import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { AutoResizeTextarea } from "@/components/ui/auto-resize-textarea"
import { FolderGit2, Plus, X } from "lucide-react"

export function ProjectsSection() {
  const dispatch = useAppDispatch()
  const resume = useAppSelector((state) => state.resume.resume)
  const projects: Project[] = resume?.projects || []

  const patchProject = (index: number, changes: Partial<Project>) => {
    const project = projects[index]
    if (!project) return
    dispatch(updateProject({ index, project: { ...project, ...changes } }))
  }

  const setBullet = (index: number, bulletIndex: number, value: string) => {
    const bullets = [...(projects[index]?.description || [])]
    bullets[bulletIndex] = value
    patchProject(index, { description: bullets })
  }

  const addBullet = (index: number) => {
    patchProject(index, { description: [...(projects[index]?.description || []), ""] })
  }

  const removeBullet = (index: number, bulletIndex: number) => {
    patchProject(index, {
      description: (projects[index]?.description || []).filter((_, i) => i !== bulletIndex),
    })
  }

  const setTechnologies = (index: number, raw: string) => {
    patchProject(index, { technologies: raw.split(",").map((t) => t.trim()) })
  }

  const cleanTechnologies = (index: number) => {
    const current = projects[index]?.technologies || []
    const cleaned = current.filter(Boolean)
    if (cleaned.length !== current.length) patchProject(index, { technologies: cleaned })
  }

  return (
    <div className="relative group">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-3xl blur opacity-10 group-hover:opacity-20 transition duration-500"></div>

      <div className="relative bg-card/80 backdrop-blur-xl border border-border/60 rounded-3xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 flex items-center justify-center border border-violet-500/25">
              <FolderGit2 className="w-4 h-4 text-violet-500" />
            </div>
            <div className="leading-tight">
              <h3 className="text-lg font-bold">Projects</h3>
              <p className="text-xs text-muted-foreground">Side projects, open source and portfolio work</p>
            </div>
          </div>
          <span className="rounded-full border border-border/60 bg-background/60 px-2.5 py-1 text-xs font-medium text-muted-foreground">
            {projects.length} {projects.length === 1 ? "project" : "projects"}
          </span>
        </div>

        <div className="space-y-6">
          {projects.length === 0 && (
            <div className="text-center py-8 border border-dashed border-border/70 rounded-2xl">
              <p className="text-sm text-muted-foreground mb-4">
                No projects yet. Showcase what you have built.
              </p>
              <Button size="sm" variant="outline" className="rounded-full" onClick={() => dispatch(addProject())}>
                <Plus className="w-4 h-4 mr-2" /> Add project
              </Button>
            </div>
          )}

          {projects.map((project, idx) => (
            <div
              key={idx}
              className="border border-border/50 bg-background/40 hover:bg-background/70 rounded-2xl p-5 sm:p-6 relative overflow-hidden group/card transition-colors duration-300"
            >
              <div
                className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-violet-500/60 to-fuchsia-500/60 opacity-0 group-hover/card:opacity-100 transition-opacity"
                aria-hidden="true"
              />

              <div className="flex items-start justify-between gap-3">
                <div className="grid flex-1 gap-3 sm:grid-cols-2">
                  <Field
                    className="sm:col-span-2"
                    label="Project name"
                    value={project.name || ""}
                    onChange={(v) => patchProject(idx, { name: v })}
                    placeholder="e.g. Resume Tailor AI"
                  />
                  <Field
                    label="Tech stack"
                    value={(project.technologies || []).join(", ")}
                    onChange={(v) => setTechnologies(idx, v)}
                    onBlur={() => cleanTechnologies(idx)}
                    placeholder="React, Python, PostgreSQL"
                    hint="Comma separated"
                  />
                  <Field
                    label="Link"
                    value={project.link || ""}
                    onChange={(v) => patchProject(idx, { link: v })}
                    placeholder="github.com/you/project"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => dispatch(removeProject({ index: idx }))}
                  className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 opacity-100 md:opacity-0 md:group-hover/card:opacity-100"
                  aria-label={`Remove ${project.name || "project"}`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 mt-4">
                {(project.description || []).map((bullet, bIdx) => (
                  <div key={bIdx} className="flex gap-3 items-start group/bullet">
                    <div
                      className="mt-[11px] w-2 h-2 rounded-full border border-violet-500/50 bg-violet-500/20 shrink-0 group-hover/bullet:bg-violet-500 group-hover/bullet:border-violet-500 group-hover/bullet:shadow-[0_0_12px_rgba(139,92,246,0.7)] transition-all duration-300"
                      aria-hidden="true"
                    />
                    <AutoResizeTextarea
                      value={bullet}
                      onChange={(v) => setBullet(idx, bIdx, v)}
                      className="w-full text-sm bg-transparent border border-transparent hover:bg-muted/40 focus:bg-background focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20 resize-none py-2 px-3 -ml-3 rounded-lg transition-all text-foreground/90 outline-none leading-relaxed"
                      placeholder="What did you build, and what was the impact?"
                    />
                    <button
                      type="button"
                      onClick={() => removeBullet(idx, bIdx)}
                      className="mt-1.5 rounded p-1 text-muted-foreground opacity-0 transition hover:bg-destructive/10 hover:text-destructive focus-visible:opacity-100 group-hover/bullet:opacity-100"
                      aria-label="Remove bullet"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addBullet(idx)}
                  className="ml-6 inline-flex items-center gap-1.5 rounded-full border border-dashed border-border/70 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-violet-500/50 hover:text-violet-600 dark:hover:text-violet-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                >
                  <Plus className="w-3.5 h-3.5" /> Add bullet
                </button>
              </div>
            </div>
          ))}

          {projects.length > 0 && (
            <button
              type="button"
              onClick={() => dispatch(addProject())}
              className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-border/70 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-violet-500/50 hover:text-violet-600 dark:hover:text-violet-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            >
              <Plus className="w-3.5 h-3.5" /> Add project
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
