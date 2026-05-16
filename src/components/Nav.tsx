import { useLocation, useNavigate } from 'react-router-dom'
import { nav } from '../data'

export function Nav() {
  const navigate = useNavigate()
  const location = useLocation()

  /**
   * Scroll to a section by id WITHOUT mutating the URL.
   * If we're not on the home route, navigate there first and pass the
   * target id in location state — `ScrollToHash` in App.tsx picks it up.
   */
  const goTo = (sectionId: string) => (e: React.MouseEvent) => {
    e.preventDefault()
    if (location.pathname === '/') {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' })
    } else {
      navigate('/', { state: { scrollTo: sectionId } })
    }
  }

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
          {nav.map((item) => {
            const sectionId = item.href.replace('#', '')
            return (
              <li key={item.href}>
                <a
                  href={item.href}
                  onClick={goTo(sectionId)}
                  className="text-muted hover:text-fg hover:bg-bg-soft rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
                >
                  {item.label}
                </a>
              </li>
            )
          })}
        </ul>
        <a
          href="#contact"
          onClick={goTo('contact')}
          className="bg-accent text-ink hover:bg-accent-soft inline-flex items-center rounded-md px-4 py-1.5 text-sm font-semibold transition-colors"
        >
          Get in touch
        </a>
      </div>
    </nav>
  )
}
