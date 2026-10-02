import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react"
import type { Resume } from "../slices/resume-slice"

export const API_BASE_URL = import.meta.env.VITE_API_URL || "https://resume-builder-bd5m.onrender.com"

export interface TemplateInfo {
  id: string
  name: string
  description: string
  preview: { accent: string; font: string; layout: string }
  is_default?: boolean
}

export interface QualityCheck {
  category: "grammar" | "tone" | "length"
  target: string
  status: "pass" | "warn" | "fail"
  detail: string
}

export interface ReviewReport {
  overall_quality_score: number
  summary_feedback: string
  bullet_feedback: { original: string; issue: string; suggestion: string; severity: "high" | "medium" | "low" }[]
  general_tips: string[]
  checks: QualityCheck[]
}

export interface PipelineResult {
  ats_score: { score: number; matching_keywords: string[]; missing_keywords: string[]; recommendations: string[] } | null
  jd_analysis: any
  gap_report: any
  review: ReviewReport | null
  errors: string[]
}

export interface InterviewQuestion {
  question: string
  category: "behavioral" | "technical" | "role_specific" | "gap_close"
  difficulty: "easy" | "medium" | "hard"
  why_asked: string
  answer_hint: string
}

export interface InterviewPlan {
  questions: InterviewQuestion[]
  strategy_tips: string[]
}

export const resumeApi = createApi({
  reducerPath: "resumeApi",
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
  }),
  endpoints: (builder) => ({
    uploadResume: builder.mutation<Resume, File>({
      query: (file) => {
        const formData = new FormData()
        formData.append("file", file)
        return {
          url: "/api/resume/upload",
          method: "POST",
          body: formData,
        }
      },
    }),
    rewriteBullets: builder.mutation<
      { rewritten_bullets: string[] },
      { original_bullets: string[]; job_description: string; template?: string }
    >({
      query: (body) => ({
        url: "/api/tailor/rewrite-bullets",
        method: "POST",
        body,
      }),
    }),
    generateSummary: builder.mutation<
      { summary: string },
      { resume_text: string; job_description: string; template?: string }
    >({
      query: (body) => ({
        url: "/api/tailor/generate-summary",
        method: "POST",
        body,
      }),
    }),
    getAtsScore: builder.mutation<
      { score: number; matching_keywords: string[]; missing_keywords: string[]; recommendations: string[] },
      { resume: Resume; job_description: string }
    >({
      query: (body) => ({
        url: "/api/analyze/ats-score",
        method: "POST",
        body,
      }),
    }),
    getGapReport: builder.mutation<
      any,
      { resume: Resume; job_description: string }
    >({
      query: (body) => ({
        url: "/api/analyze/gap-report",
        method: "POST",
        body,
      }),
    }),
    chatEdit: builder.mutation<
      { assistant_message: string; updated_resume: Resume },
      { resume: Resume; job_description: string; messages: any[]; user_message: string; template?: string }
    >({
      query: (body) => ({
        url: "/api/tailor/chat-edit",
        method: "POST",
        body,
      }),
    }),
    saveVersion: builder.mutation<
      any,
      { session_id: string; label: string; resume: Resume; job_description: string; ats_score: number }
    >({
      query: (body) => ({
        url: "/api/resume/versions/save",
        method: "POST",
        body,
      }),
    }),
    getVersions: builder.query<any[], string>({
      query: (session_id) => `/api/resume/versions/${session_id}`,
    }),
    generateCoverLetter: builder.mutation<
      { cover_letter: string },
      { resume: Resume; job_description: string; template?: string }
    >({
      query: (body) => ({
        url: "/api/tailor/cover-letter",
        method: "POST",
        body,
      }),
    }),
    getTemplates: builder.query<TemplateInfo[], void>({
      query: () => "/api/export/templates",
      // Template catalogue rarely changes during a session
      keepUnusedDataFor: 60 * 60,
    }),
    runPipeline: builder.mutation<PipelineResult, { resume: Resume; job_description: string }>({
      query: (body) => ({
        url: "/api/analyze/pipeline",
        method: "POST",
        body,
      }),
    }),
    generateInterviewQuestions: builder.mutation<
      InterviewPlan,
      { resume: Resume; job_description: string; count?: number }
    >({
      query: (body) => ({
        url: "/api/interview/questions",
        method: "POST",
        body,
      }),
    }),
  }),
})

export const {
  useUploadResumeMutation,
  useRewriteBulletsMutation,
  useGenerateSummaryMutation,
  useGetAtsScoreMutation,
  useGetGapReportMutation,
  useChatEditMutation,
  useSaveVersionMutation,
  useGetVersionsQuery,
  useGenerateCoverLetterMutation,
  useGetTemplatesQuery,
  useRunPipelineMutation,
  useGenerateInterviewQuestionsMutation,
} = resumeApi
