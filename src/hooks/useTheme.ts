import { useCallback, useEffect, useState } from 'react'

export type ThemeId = 'midnight' | 'slate-sand' | 'sage-stone'

export interface ThemeOption {
  id: ThemeId
  label: string
  description: string
  swatchBg: string
  swatchAccent: string
  isDark: boolean
  themeColor: string
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'midnight',
    label: 'Midnight',
    description: 'Deep teal & ice mist',
    swatchBg: '#0B0E0E',
    swatchAccent: '#A5C9CA',
    isDark: true,
    themeColor: '#0B0E0E',
  },
  {
    id: 'slate-sand',
    label: 'Sandstone',
    description: 'Slate & warm neutral',
    swatchBg: '#222831',
    swatchAccent: '#DFD0B8',
    isDark: true,
    themeColor: '#222831',
  },
  {
    id: 'sage-stone',
    label: 'Crimson',
    description: 'Deep garnet, crimson & buttercream',
    swatchBg: '#3E0703',
    swatchAccent: '#FFF0C4',
    isDark: true,
    themeColor: '#3E0703',
  },
]

const STORAGE_KEY = 'portfolio-theme'

function isThemeId(value: string | null | undefined): value is ThemeId {
  return (
    value === 'midnight' || value === 'slate-sand' || value === 'sage-stone'
  )
}

function readInitialTheme(): ThemeId {
  if (typeof document !== 'undefined') {
    const attr = document.documentElement.dataset.theme
    if (isThemeId(attr)) {
      return attr
    }
  }
  if (typeof window !== 'undefined') {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY)
      if (isThemeId(saved)) {
        return saved
      }
    } catch {
      // Ignore storage access errors
    }
  }
  return 'midnight'
}

function applyThemeToDocument(themeId: ThemeId) {
  if (typeof document === 'undefined') {
    return
  }
  const option =
    THEME_OPTIONS.find((item) => item.id === themeId) ?? THEME_OPTIONS[0]
  const root = document.documentElement
  root.dataset.theme = option.id
  root.classList.toggle('dark', option.isDark)

  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) {
    meta.setAttribute('content', option.themeColor)
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, option.id)
  } catch {
    // Ignore storage access errors
  }
}

/**
 * Manages the active portfolio color theme, persisting selection in
 * `localStorage` and syncing `data-theme` on `<html>`.
 */
export function useTheme() {
  const [theme, setThemeState] = useState<ThemeId>(readInitialTheme)

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const attr = document.documentElement.dataset.theme
      if (isThemeId(attr)) {
        setThemeState(attr)
      }
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })
    return () => observer.disconnect()
  }, [])

  const setTheme = useCallback((nextTheme: ThemeId) => {
    applyThemeToDocument(nextTheme)
    setThemeState(nextTheme)
  }, [])

  return {
    theme,
    setTheme,
    options: THEME_OPTIONS,
  }
}
