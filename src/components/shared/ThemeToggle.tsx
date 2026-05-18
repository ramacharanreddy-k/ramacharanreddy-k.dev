import { useTheme } from './useTheme'
import { MoonIcon, SunIcon } from './Icons'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="text-muted hover:text-fg hover:bg-bg-soft inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors"
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  )
}
