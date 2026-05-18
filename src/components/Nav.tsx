import { useScrollToSection } from './shared/useScrollToSection'
import { ThemeToggle } from './shared/ThemeToggle'
import { nav } from '../data'

export function Nav() {
  const goTo = useScrollToSection()

  return (
    <nav className="bg-bg/80 border-border sticky top-0 z-50 border-b backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">
        <a
          href="/"
          onClick={goTo('about')}
          className="text-fg text-lg font-bold tracking-tight"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          ram<span className="text-accent">.</span>
        </a>
        <ul className="hidden items-center gap-1 md:flex">
          {nav.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                onClick={goTo(item.href.slice(1))}
                className="text-muted hover:text-fg hover:bg-bg-soft rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <a
            href="#contact"
            onClick={goTo('contact')}
            className="bg-accent text-ink hover:bg-accent-soft inline-flex items-center rounded-md px-4 py-1.5 text-sm font-semibold transition-colors"
          >
            Get in touch
          </a>
        </div>
      </div>
    </nav>
  )
}
