import type { ReactNode } from 'react'

/**
 * Small "// label" eyebrow used at the top of every card and inline section header.
 * The `//` is the cyan accent prefix; pass margin/alignment via className.
 */
export function Eyebrow({
  className = '',
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return (
    <p
      className={`text-muted font-mono text-[10px] font-semibold tracking-widest uppercase ${className}`}
    >
      <span className="text-accent">//</span> {children}
    </p>
  )
}
