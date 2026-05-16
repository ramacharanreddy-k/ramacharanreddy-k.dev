import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { Nav } from './components/Nav'
import { Footer } from './components/Footer'
import { Portfolio } from './pages/Portfolio'
import { BlogPost } from './pages/BlogPost'

/**
 * Handle scroll behavior on route change.
 * - `location.state.scrollTo` → smooth-scroll to that section id (Nav clicks from other routes).
 * - `location.hash` → smooth-scroll to that anchor (backwards-compat for shared deep links).
 * - Otherwise → scroll to top.
 */
function ScrollToHash() {
  const location = useLocation()
  useEffect(() => {
    const state = location.state as { scrollTo?: string } | null
    const target = state?.scrollTo ?? location.hash.slice(1)
    if (target) {
      const el = document.getElementById(target)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' })
        return
      }
    }
    window.scrollTo(0, 0)
  }, [location.pathname, location.hash, location.state])
  return null
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToHash />
      <div className="bg-bg text-fg min-h-screen antialiased">
        <Nav />
        <main className="mx-auto max-w-7xl px-4 pb-24 md:px-8">
          <Routes>
            <Route path="/" element={<Portfolio />} />
            <Route path="/writing/:slug" element={<BlogPost />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  )
}

export default App
