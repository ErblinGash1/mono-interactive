import { useEffect, useState } from 'react'
import { navigation } from '../content/navigation.js'

export function useActiveSection() {
  const [active, setActive] = useState('#experience')
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) setActive('#' + entry.target.id)
      }
    }, { rootMargin: '-20% 0px -65% 0px' })
    for (const link of navigation) {
      const section = document.querySelector(link.href)
      if (section) observer.observe(section)
    }
    return () => observer.disconnect()
  }, [])
  return active
}
