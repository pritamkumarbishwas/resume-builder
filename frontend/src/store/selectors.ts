import { createSelector } from "@reduxjs/toolkit"
import type { RootState } from "@/store"

export const selectConversations = (state: RootState) => state.conversations.items
export const selectActiveConversationId = (state: RootState) => state.ui.activeConversationId
export const selectSidebarOpen = (state: RootState) => state.ui.sidebarOpen

export const selectActiveConversation = createSelector(
  [selectActiveConversationId, selectConversations],
  (id, items) => (id ? items.find((c) => c.id === id) ?? null : null),
)

export const selectConversationMessages = createSelector(
  [selectActiveConversation],
  (conv) => conv?.messages ?? [],
)
