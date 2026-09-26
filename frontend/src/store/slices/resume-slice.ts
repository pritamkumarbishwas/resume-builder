import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

export interface Experience {
  title: string
  company: string
  start_date: string
  end_date?: string
  location?: string
  description: string[]
}

export interface Education {
  degree: string
  institution: string
  graduation_date: string
  location?: string
  gpa?: string
}

export interface Skill {
  category: string
  skills: string[]
}

export interface Project {
  name: string
  description: string[]
  technologies: string[]
  link?: string
}

export interface Resume {
  name: string
  email?: string
  phone?: string
  linkedin?: string
  portfolio?: string
  summary: string
  experiences: Experience[]
  education: Education[]
  projects?: Project[]
  skills: Skill[]
}

type WizardStep = "UPLOAD" | "JOB_DESC" | "TAILOR"

interface ResumeState {
  step: WizardStep
  resume: Resume | null
  jobDescription: string
  isAnalyzing: boolean
}

const initialState: ResumeState = {
  step: "UPLOAD",
  resume: null,
  jobDescription: "",
  isAnalyzing: false,
}

const resumeSlice = createSlice({
  name: "resume",
  initialState,
  reducers: {
    setStep(state, action: PayloadAction<WizardStep>) {
      state.step = action.payload
    },
    setResume(state, action: PayloadAction<Resume>) {
      state.resume = action.payload
    },
    setJobDescription(state, action: PayloadAction<string>) {
      state.jobDescription = action.payload
    },
    updateSummary(state, action: PayloadAction<string>) {
      if (state.resume) {
        state.resume.summary = action.payload
      }
    },
    updateExperienceBullets(
      state,
      action: PayloadAction<{ index: number; bullets: string[] }>,
    ) {
      if (state.resume && state.resume.experiences[action.payload.index]) {
        state.resume.experiences[action.payload.index].description =
          action.payload.bullets
      }
    },
    updateProject(state, action: PayloadAction<{ index: number; project: Project }>) {
      if (state.resume && state.resume.projects?.[action.payload.index]) {
        state.resume.projects[action.payload.index] = action.payload.project
      }
    },
    addProject(state) {
      if (state.resume) {
        if (!state.resume.projects) state.resume.projects = []
        state.resume.projects.push({ name: "", description: [], technologies: [] })
      }
    },
    removeProject(state, action: PayloadAction<{ index: number }>) {
      if (state.resume && state.resume.projects?.[action.payload.index]) {
        state.resume.projects.splice(action.payload.index, 1)
      }
    },
    updateEducation(state, action: PayloadAction<{ index: number; education: Education }>) {
      if (state.resume && state.resume.education[action.payload.index]) {
        state.resume.education[action.payload.index] = action.payload.education
      }
    },
    addEducation(state) {
      if (state.resume) {
        state.resume.education.push({
          degree: "",
          institution: "",
          graduation_date: "",
          location: "",
          gpa: "",
        })
      }
    },
    removeEducation(state, action: PayloadAction<{ index: number }>) {
      if (state.resume && state.resume.education[action.payload.index]) {
        state.resume.education.splice(action.payload.index, 1)
      }
    },
    updateSkillGroup(state, action: PayloadAction<{ index: number; skills: string[] }>) {
      if (state.resume && state.resume.skills[action.payload.index]) {
        state.resume.skills[action.payload.index].skills = action.payload.skills
      }
    },
    updateSkillCategory(state, action: PayloadAction<{ index: number; category: string }>) {
      if (state.resume && state.resume.skills[action.payload.index]) {
        state.resume.skills[action.payload.index].category = action.payload.category
      }
    },
    addSkillGroup(state, action: PayloadAction<{ category: string; skills?: string[] }>) {
      if (state.resume) {
        state.resume.skills.push({
          category: action.payload.category,
          skills: action.payload.skills ?? [],
        })
      }
    },
    removeSkillGroup(state, action: PayloadAction<{ index: number }>) {
      if (state.resume && state.resume.skills[action.payload.index]) {
        state.resume.skills.splice(action.payload.index, 1)
      }
    },
  },
})

export const {
  setStep,
  setResume,
  setJobDescription,
  updateSummary,
  updateExperienceBullets,
  updateProject,
  addProject,
  removeProject,
  updateEducation,
  addEducation,
  removeEducation,
  updateSkillGroup,
  updateSkillCategory,
  addSkillGroup,
  removeSkillGroup,
} = resumeSlice.actions

export default resumeSlice.reducer
