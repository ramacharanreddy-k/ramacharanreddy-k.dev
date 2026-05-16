import type { ReactNode } from 'react'

export function SocialButton({
  href,
  label,
  children,
}: {
  href: string
  label: string
  children: ReactNode
}) {
  return (
    <a
      href={href}
      aria-label={label}
      className="border-ink/15 text-ink-soft hover:border-ink hover:bg-ink hover:text-paper flex size-9 items-center justify-center rounded-md border transition-colors"
    >
      {children}
    </a>
  )
}
