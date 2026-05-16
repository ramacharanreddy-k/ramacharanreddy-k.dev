import type { ReactNode } from 'react'

export function SectionFrame({
  id,
  eyebrow,
  title,
  children,
}: {
  id: string
  eyebrow: string
  title: string
  children: ReactNode
}) {
  return (
    <section id={id} className="py-10 md:py-14">
      <div className="mb-10 flex items-baseline gap-4 md:mb-12">
        <span className="text-muted font-mono text-xs tracking-widest uppercase">{eyebrow}</span>
        <h2
          className="text-fg text-2xl font-bold tracking-tight md:text-4xl"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {title}
        </h2>
        <span className="bg-border ml-2 h-px flex-1" />
      </div>
      {children}
    </section>
  )
}
