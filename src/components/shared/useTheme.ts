import { useCallback, useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

const THEME_COLOR = { light: '#fafafa', dark: '#0a0a0a' } as const

function readInitialTheme(): Theme {
  if (typeof document !== 'undefined' && document.documentElement.classList.contains('dark')) {
    return 'dark'
  }
  return 'light'
}

function applyThemeColorMeta(theme: Theme) {
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
  if (meta) meta.content = THEME_COLOR[theme]
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(readInitialTheme)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    applyThemeColorMeta(theme)
  }, [theme])

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark'
      try {
        localStorage.setItem('theme', next)
      } catch {
        /* storage blocked — toggle still works for the session */
      }
      return next
    })
  }, [])

  return { theme, toggleTheme }
}
