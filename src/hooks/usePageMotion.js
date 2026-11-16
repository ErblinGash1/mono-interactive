import { useLayoutEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function usePageMotion(scope) {
  useLayoutEffect(() => {
    const media = gsap.matchMedia()

    media.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.from('[data-intro]', {
        opacity: 0, y: 24, duration: 0.95, stagger: 0.09,
        ease: 'power3.out', clearProps: 'opacity,transform',
      })
      scope.current.querySelectorAll('[data-reveal]').forEach((element) => {
        gsap.from(element, {
          y: 28, opacity: 0, duration: 0.85,
          ease: 'power2.out', clearProps: 'opacity,transform',
          scrollTrigger: { trigger: element, start: 'top 92%', once: true },
        })
      })
    }, scope)

    return () => media.revert()
  }, [scope])
}
