import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react"
import type { Resume } from "../slices/resume-slice"

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000"

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
      { original_bullets: string[]; job_description: string }
    >({
      query: (body) => ({
        url: "/api/tailor/rewrite-bullets",
        method: "POST",
        body,
      }),
    }),
    generateSummary: builder.mutation<
      { summary: string },
      { resume_text: string; job_description: string }
    >({
      query: (body) => ({
        url: "/api/tailor/generate-summary",
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
} = resumeApi
