import { useRef } from 'react'
import SiteHeader from '../components/layout/SiteHeader.jsx'
import SiteFooter from '../components/layout/SiteFooter.jsx'
import Experience from '../features/experience/Experience.jsx'
import { usePageMotion } from '../hooks/usePageMotion.js'

export default function App() {
  const page = useRef(null)
  usePageMotion(page)

  return (
    <div ref={page} className="site-shell">
      <a className="skip-link" href="#main">Skip to content</a>
      <SiteHeader />
      <main id="main" tabIndex={-1}>
        <Experience />
      </main>
      <SiteFooter />
    </div>
  )
}
