const STORAGE_KEY = "rb_session_id"

/**
 * Stable id for this browser tab's version history.
 * Generated once and kept in sessionStorage so versions survive reloads
 * but don't collide with other browsers/devices.
 */
export function getSessionId(): string {
  let id = sessionStorage.getItem(STORAGE_KEY)
  if (!id) {
    id = typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `s-${Date.now()}-${Math.random().toString(36).slice(2)}`
    sessionStorage.setItem(STORAGE_KEY, id)
  }
  return id
}
