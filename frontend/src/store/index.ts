import { configureStore } from "@reduxjs/toolkit"
import resumeReducer from "./slices/resume-slice"
import { resumeApi } from "./api/resume-api"

export const store = configureStore({
  reducer: {
    resume: resumeReducer,
    [resumeApi.reducerPath]: resumeApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(resumeApi.middleware),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
