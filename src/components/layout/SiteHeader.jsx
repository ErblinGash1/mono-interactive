import { useEffect, useRef, useState } from 'react'
import { navigation } from '../../content/navigation.js'
import ArrowIcon from '../ui/ArrowIcon.jsx'
import { useActiveSection } from '../../hooks/useActiveSection.js'

export default function SiteHeader() {
  const activeSection = useActiveSection()
  const [menuOpen, setMenuOpen] = useState(false)
  const header = useRef(null)
  const menuButton = useRef(null)

  useEffect(() => {
    if (!menuOpen) return

    function onKeyDown(event) {
      if (event.key === 'Escape') {
        setMenuOpen(false)
        menuButton.current?.focus()
      }
    }
    function onPointerDown(event) {
      if (!header.current?.contains(event.target)) setMenuOpen(false)
    }
    const desktop = window.matchMedia('(min-width: 768px)')
    const closeOnDesktop = () => {
      if (desktop.matches) setMenuOpen(false)
    }

    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onPointerDown)
    desktop.addEventListener('change', closeOnDesktop)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown)
      desktop.removeEventListener('change', closeOnDesktop)
    }
  }, [menuOpen])

  return (
    <header className="site-header page-gutter" ref={header}>
      <a className="wordmark" href="#experience" aria-label="MONO home" onClick={() => setMenuOpen(false)}>
        mono<span className="wordmark-dot">+</span>
      </a>
      <span className="header-caption eyebrow">Independent hardware concept</span>
      <button className="menu-toggle" type="button" ref={menuButton}
        aria-expanded={menuOpen} aria-controls="primary-navigation"
        onClick={() => setMenuOpen((open) => !open)}>
        {menuOpen ? 'Close' : 'Menu'}
        <span aria-hidden="true">{menuOpen ? '−' : '+'}</span>
      </button>
      <nav id="primary-navigation"
        className={`primary-navigation ${menuOpen ? 'is-open' : ''}`}
        aria-label="Primary navigation"
        onBlur={(event) => {
          if (!header.current?.contains(event.relatedTarget)) setMenuOpen(false)
        }}>
        {navigation.map(({ label, href }, index) => (
          <a key={href} href={href} aria-current={activeSection === href ? 'location' : undefined} onClick={() => setMenuOpen(false)}>
            {activeSection === href && <span className="nav-dot" aria-hidden="true" />}
            {label}
            {index === navigation.length - 1 && <ArrowIcon diagonal />}
          </a>
        ))}
      </nav>
    </header>
  )
}
