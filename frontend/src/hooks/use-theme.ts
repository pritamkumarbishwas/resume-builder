import { useState, useEffect, useCallback } from "react"

type Theme = "light" | "dark"

function getTheme(): Theme {
  if (typeof window === "undefined") return "dark"
  const stored = localStorage.getItem("theme") as Theme | null
  if (stored === "light" || stored === "dark") return stored
  return "dark"
}

function applyTheme(theme: Theme) {
  const root = document.documentElement
  root.classList.remove("light", "dark")
  root.classList.add(theme)
  localStorage.setItem("theme", theme)
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getTheme)

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"))
  }, [])

  return { theme, setTheme, toggleTheme }
}
