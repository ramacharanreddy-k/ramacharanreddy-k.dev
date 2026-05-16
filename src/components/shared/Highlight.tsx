import type { ReactNode } from 'react'

export function Highlight({ children }: { children: ReactNode }) {
  return (
    <span
      className="relative inline-block"
      style={{
        backgroundImage:
          'linear-gradient(180deg, transparent 60%, var(--color-accent-soft) 60%, var(--color-accent-soft) 92%, transparent 92%)',
        padding: '0 0.15em',
      }}
    >
      {children}
    </span>
  )
}
