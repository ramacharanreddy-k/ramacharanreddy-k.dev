import type { ReactNode } from 'react'
import { useScrollToSection } from './useScrollToSection'

type Variant = 'primary' | 'outline' | 'ghost'
type Size = 'sm' | 'md'

const variantClass: Record<Variant, string> = {
  primary: 'bg-ink text-paper hover:bg-accent hover:text-ink gap-2',
  outline: 'border-ink text-ink hover:bg-ink hover:text-paper border bg-transparent',
  ghost:
    'text-ink-soft hover:text-ink gap-1.5 underline-offset-4 hover:underline px-2 bg-transparent',
}

const sizeClass: Record<Size, string> = {
  sm: 'px-5 py-2.5',
  md: 'px-5 py-3',
}

/**
 * Pill-shaped link button used for hero CTAs and the contact section.
 * - `ghost` ignores `size` padding (uses its own inline padding).
 * - If `href` starts with `#`, the click is intercepted to smooth-scroll
 *   to that section WITHOUT polluting the URL with the hash.
 *   Cross-route case: navigates to `/` first, then scrolls after mount.
 */
export function Cta({
  href,
  variant = 'primary',
  size = 'sm',
  className = '',
  children,
}: {
  href: string
  variant?: Variant
  size?: Size
  className?: string
  children: ReactNode
}) {
  const goTo = useScrollToSection()
  const padding = variant === 'ghost' ? 'py-2.5' : sizeClass[size]
  const onClick = href.startsWith('#') ? goTo(href.slice(1)) : undefined

  return (
    <a
      href={href}
      onClick={onClick}
      className={`inline-flex items-center rounded-md text-sm font-semibold transition-colors ${variantClass[variant]} ${padding} ${className}`}
    >
      {children}
    </a>
  )
}
