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
  return ` ${tokenizeTerm(text)} `
}

function tokenizeTerm(term: string): string {
  return term.toLowerCase().replace(/[^\p{L}\p{N}+#]+/gu, " ").replace(/\s+/g, " ").trim()
}

/**
 * Every form a term can legitimately take in a job description:
 * - the plain token
 * - singular/plural of the last word ("APIs" ↔ "API")
 * - parenthetical alternates ("Amazon Web Services (AWS)" → "aws", "amazon web services")
 * - trailing version/short-token drops ("Python 3" → "python", "AWS S3" → "aws")
 * - framework-suffix drops ("React.js" → "React")
 * - the joined compound ("node js" → "nodejs")
 */
export function termVariants(term: string): string[] {
  const out = new Set<string>()
  const add = (t: string) => {
    const tok = tokenizeTerm(t)
    if (tok) out.add(tok)
  }

  add(term)

  const paren = /\(([^)]{1,40})\)/.exec(term)
  if (paren) {
    add(term.replace(/\([^)]*\)/g, " "))
    add(paren[1])
  }

  const words = tokenizeTerm(term).split(" ").filter(Boolean)
  if (words.length === 0) return [...out]

  const last = words[words.length - 1]
  if (last.length > 1 && !/^\d+$/.test(last)) {
    if (last.endsWith("s")) add([...words.slice(0, -1), last.slice(0, -1)].join(" "))
    else add([...words.slice(0, -1), `${last}s`].join(" "))
  }

  let trimmed = words.slice()
  while (trimmed.length > 1) {
    const tail = trimmed[trimmed.length - 1]
    if (/^\d+$/.test(tail) || tail.length <= 2) trimmed = trimmed.slice(0, -1)
    else break
  }
  if (trimmed.length < words.length) add(trimmed.join(" "))

  if (words.length > 1 && last === "js") add(words.slice(0, -1).join(" "))
  if (words.length > 1) add(words.join(""))

  return [...out]
}

/** True when `term` (or one of its variants) appears as a whole token/phrase inside an already normalized text. */
export function containsToken(normalizedText: string, term: string): boolean {
  return termVariants(term).some((variant) => normalizedText.includes(` ${variant} `))
}

/** Case-insensitive match of a term against a list of skills/keywords, allowing either side's variants. */
export function includesTerm(list: string[], term: string): boolean {
  const key = term.trim().toLowerCase()
  if (!key) return false
  const termNormalized = normalizeMatchText(term)
  return list.some((item) => {
    const itemKey = item.trim().toLowerCase()
    if (!itemKey) return false
    if (itemKey === key) return true
    return containsToken(normalizeMatchText(item), term) || containsToken(termNormalized, item)
  })
}
