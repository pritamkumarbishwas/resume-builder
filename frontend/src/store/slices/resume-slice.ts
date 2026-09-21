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

export interface Resume {
  name: string
  email?: string
  phone?: string
  linkedin?: string
  portfolio?: string
  summary: string
  experiences: Experience[]
  education: Education[]
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
  },
})

export const {
  setStep,
  setResume,
  setJobDescription,
  updateSummary,
  updateExperienceBullets,
} = resumeSlice.actions

export default resumeSlice.reducer
