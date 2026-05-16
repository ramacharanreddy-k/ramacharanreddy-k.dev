import { useLocation, useNavigate } from 'react-router-dom'

/**
 * Returns a click handler factory that smooth-scrolls to a section by id
 * WITHOUT mutating the URL with a hash.
 *
 * Usage: `const goTo = useScrollToSection(); <a onClick={goTo('projects')} />`
 *
 * - On the home route: prevents default + scrollIntoView.
 * - On any other route: navigates to `/` and passes the target id via location
 *   state; `ScrollToHash` in App.tsx picks it up and scrolls after mount.
 */
export function useScrollToSection() {
  const navigate = useNavigate()
  const location = useLocation()
  return (sectionId: string) => (e: React.MouseEvent) => {
    e.preventDefault()
    if (location.pathname === '/') {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' })
    } else {
      navigate('/', { state: { scrollTo: sectionId } })
    }
  }
}
