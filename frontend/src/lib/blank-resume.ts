import type { Resume } from "@/store/slices/resume-slice"

export function createBlankResume(): Resume {
  return {
    name: "",
    email: "",
    phone: "",
    linkedin: "",
    portfolio: "",
    summary: "",
    experiences: [],
    education: [],
    projects: [],
    skills: [{ category: "Skills", skills: [] }],
  }
}
