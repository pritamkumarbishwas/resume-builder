import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Lowercases text and collapses every separator (spaces, punctuation, dots,
 * slashes…) into single spaces, wrapped in padding, so terms can be matched
 * on whole tokens only. "Java" will not match "JavaScript", but "Node.js",
 * "node js" and "CI/CD" all match their own variants.
 */
export function normalizeMatchText(text: string): string {
  return ` ${text.toLowerCase().replace(/[^\p{L}\p{N}+#]+/gu, " ").replace(/\s+/g, " ").trim()} `
}

/** True when `term` appears as a whole token/phrase inside an already normalized text. */
export function containsToken(normalizedText: string, term: string): boolean {
  const token = term.toLowerCase().replace(/[^\p{L}\p{N}+#]+/gu, " ").replace(/\s+/g, " ").trim()
  return token.length > 0 && normalizedText.includes(` ${token} `)
}

/** Case-insensitive exact match of a term against a list of skills/keywords. */
export function includesTerm(list: string[], term: string): boolean {
  const key = term.trim().toLowerCase()
  if (!key) return false
  return list.some((item) => item.trim().toLowerCase() === key)
}
