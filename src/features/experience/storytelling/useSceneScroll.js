/* oxlint-disable react/immutability -- ScrollTrigger owns this imperative DOM bridge; refs identify DOM elements, not React state. */
import { useLayoutEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { CHAPTER, chapterProgress, clamp01, easeRange, sampleSequence } from '../scene/sequence.js'
import { FINALE, sampleFinale } from '../scene/finale.js'

gsap.registerPlugin(ScrollTrigger)

// ScrollTrigger owns scroll sampling; CSS sticky owns pinning. No pin spacer,
// second renderer, imperative reparenting, or time-based scrub state.
export function useSceneScroll({ chapter, slot, construction, finale, finalePanel, sticky, hostRef, motionRef, staticMode, onExploring, onRegion }) {
  useLayoutEffect(() => {
    const metrics = {}
    const previous = motionRef.current.metrics
    const preserveChapter = previous && previous.staticMode !== staticMode && previous.inside
    const preservedRegion = previous?.region
    let exploring = false
    let region = ''
    let cancelled = false
    let frameId = 0
    let anchorFrame = 0
    const finaleCue = finalePanel.current.querySelector('.finale-cue > span')
    const measure = () => {
      const scroll = window.scrollY
      const parent = chapter.current.getBoundingClientRect()
      const source = slot.current.getBoundingClientRect()
      const story = construction.current.getBoundingClientRect()
      const ending = finale.current.getBoundingClientRect()
      const height = sticky.current.getBoundingClientRect().height
      const gutter = parseFloat(getComputedStyle(construction.current).paddingLeft)
      const small = parent.width < 900
      const compact = small && height < 600 && parent.width > height
      const shortPortrait = small && height < 600 && parent.width <= height
      const showLabels = parent.width >= 1100 && height >= 650
      const left = compact ? gutter + 235 : small ? gutter : Math.max(gutter + 275, parent.width * 0.245)
      Object.assign(metrics, {
        staticMode,
        parentTop: parent.top + scroll, sourceX: source.left - parent.left, sourceY: source.top + scroll,
        sourceWidth: source.width, sourceHeight: source.height, height,
        storyTop: story.top + scroll, storyHeight: story.height, start: Math.max(0, story.top + scroll - height),
        end: story.top + scroll + story.height - height,
        finaleTop: ending.top + scroll, finaleHeight: ending.height,
        finaleEnd: ending.top + scroll + ending.height - height,
        targetX: left, targetY: compact ? height * 0.08 : shortPortrait ? height * 0.21 : small ? height * 0.255 : height * 0.10,
        targetWidth: parent.width - left - gutter, targetHeight: compact ? height * 0.84 : shortPortrait ? height * 0.36 : small ? height * 0.43 : height * 0.79,
        labelGutter: showLabels ? 172 : 0, rem: parseFloat(getComputedStyle(document.documentElement).fontSize),
        finaleX: compact ? gutter + 235 : small ? gutter : parent.width * 0.41,
        finaleY: compact ? height * 0.06 : shortPortrait ? height * 0.37 : small ? height * 0.29 : height * 0.12,
        finaleWidth: parent.width - (compact ? gutter + 235 : small ? gutter : parent.width * 0.41) - gutter,
        finaleSceneHeight: compact ? height * 0.88 : shortPortrait ? height * 0.36 : small ? height * 0.40 : height * 0.65,
      })
      // Native anchors and deep links share this exact inspection coordinate.
      construction.current.style.setProperty('--inspect-offset', (staticMode ? 0 : metrics.start + CHAPTER.inspect * (metrics.end - metrics.start) - metrics.storyTop) + 'px')
      // Write measured anchor positions directly. Initial fragment alignment
      // must not observe a stale custom-property fallback during first layout.
      finale.current.querySelector('#signature-key').style.top = (staticMode ? 0 : FINALE.detail * (metrics.finaleHeight - height)) + 'px'
      finale.current.querySelector('#finale-composition').style.top = (staticMode ? 0 : FINALE.composition * (metrics.finaleHeight - height)) + 'px'
      motionRef.current.metrics = metrics
    }
    const paint = scroll => {
      const normal = chapterProgress(scroll, metrics.storyTop, metrics.storyHeight, metrics.height)
      const reducedStory = staticMode && scroll >= metrics.storyTop - metrics.height * 0.12
      const progress = staticMode ? reducedStory ? CHAPTER.inspect : 0 : normal
      const pose = sampleSequence(progress, motionRef.current.pose)
      const inFinale = scroll > metrics.finaleTop - metrics.height
      const inStory = !inFinale && scroll > metrics.end + 1
      if (inFinale) {
        const finalProgress = staticMode ? 1 : clamp01((scroll - metrics.finaleTop) / Math.max(1, metrics.finaleHeight - metrics.height))
        sampleFinale(finalProgress, pose)
      }
      const entry = staticMode ? Number(reducedStory) : pose.entry
      metrics.inside = (scroll >= metrics.storyTop - metrics.height * 0.12 && scroll <= metrics.end + 1) || scroll >= metrics.finaleTop - metrics.height * 0.12
      metrics.region = inFinale ? 'finale' : inStory ? 'story' : progress > 0 ? 'construction' : 'hero'
      const fixedFromY = metrics.sourceY - metrics.start
      const sourceY = progress > 0 ? fixedFromY : metrics.sourceY - scroll
      const stickyTop = Math.max(0, metrics.parentTop - scroll)
      const x = inFinale ? metrics.finaleX : metrics.sourceX + (metrics.targetX - metrics.sourceX) * entry
      const y = inFinale ? metrics.finaleY + Math.max(0, metrics.finaleTop - scroll)
        : sourceY + (metrics.targetY - sourceY) * entry - stickyTop - Math.max(0, scroll - metrics.end)
      const element = hostRef.current
      element.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)'
      element.style.width = (inFinale ? metrics.finaleWidth : metrics.sourceWidth + (metrics.targetWidth - metrics.sourceWidth) * entry) + 'px'
      element.style.height = (inFinale ? metrics.finaleSceneHeight : metrics.sourceHeight + (metrics.targetHeight - metrics.sourceHeight) * entry) + 'px'
      element.style.visibility = inStory && scroll > metrics.end + metrics.height ? 'hidden' : 'visible'
      element.style.setProperty('--scene-entry', entry)
      element.style.setProperty('--stage-inset', -(metrics.rem * (metrics.height < 700 ? 1 : 2)) * (1 - entry) + 'px')
      element.style.setProperty('--stage-footer', 90 * (1 - entry) + 'px')
      element.style.setProperty('--control-footer', 45 * (1 - entry) + 'px')
      element.style.setProperty('--callout-gutter', (inFinale ? 0 : metrics.labelGutter * entry) + 'px')
      element.dataset.exploring = String(pose.progress > 0)
      element.dataset.region = metrics.region
      element.dataset.progress = pose.progress.toFixed(5)
      element.dataset.spread = pose.spread.toFixed(5)
      element.dataset.finaleProgress = pose.signature.progress.toFixed(5)
      const panel = finalePanel.current
      const ending = pose.signature
      panel.style.setProperty('--finale-complete', staticMode ? 1 : ending.complete)
      panel.style.setProperty('--finale-copy-out', staticMode ? 1 : easeRange(0.73, 0.85, ending.progress))
      panel.dataset.complete = String(staticMode || ending.complete > 0)
      const caption = ending.progress < 0.57 ? '01 / Separate' : ending.progress < 0.69 ? '02 / A precise response' : ending.progress < 0.90 ? '03 / Follow the signal' : '04 / The considered whole'
      if (finaleCue.textContent !== caption) finaleCue.textContent = caption
      construction.current.style.setProperty('--construction-visibility', entry)
      if (motionRef.current.callouts) {
        motionRef.current.callouts.style.opacity = pose.labels
        motionRef.current.callouts.inert = pose.labels < 0.5
      }
      const nextExploring = pose.progress > 0
      if (exploring !== nextExploring) { exploring = nextExploring; onExploring(exploring) }
      if (region !== metrics.region) { region = metrics.region; onRegion(region) }
      motionRef.current.invalidate?.()
    }
    measure()
    if (preserveChapter) {
      const bookmark = preservedRegion === 'finale'
        ? staticMode ? metrics.finaleTop : metrics.finaleTop + FINALE.composition * (metrics.finaleHeight - metrics.height)
        : staticMode ? metrics.storyTop : metrics.start + CHAPTER.inspect * (metrics.end - metrics.start)
      window.scrollTo({ top: bookmark, behavior: 'instant' })
    }
    paint(window.scrollY)
    const trigger = ScrollTrigger.create({
      id: 'mono-construction', start: 0, end: () => metrics.finaleEnd,
      onRefreshInit: measure,
      onUpdate: self => paint(self.scroll()),
      onRefresh: self => paint(self.scroll()),
    })
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frameId)
      frameId = requestAnimationFrame(() => { if (!cancelled) trigger.refresh() })
    })
    observer.observe(slot.current)
    observer.observe(construction.current)
    observer.observe(finale.current)
    let userMoved = false
    const initialHash = window.location.hash
    const onInput = () => { userMoved = true }
    const inputEvents = ['wheel', 'touchstart', 'keydown', 'pointerdown']
    inputEvents.forEach(event => window.addEventListener(event, onInput, { passive: true }))
    let onLoad
    const loaded = document.readyState === 'complete' ? Promise.resolve() : new Promise(resolve => {
      onLoad = resolve
      window.addEventListener('load', onLoad, { once: true })
    })
    const typeReady = document.fonts.load('400 16px "Space Grotesk Variable"').catch(() => [])
    Promise.all([typeReady, document.fonts.ready, loaded]).then(() => {
      if (cancelled) return
      measure()
      trigger.refresh()
      // The browser may apply its initial fragment scroll after font readiness.
      // Align once after load and two layout frames, without overriding input.
      anchorFrame = requestAnimationFrame(() => {
        anchorFrame = requestAnimationFrame(() => {
          if (cancelled) return
          if (!motionRef.current.anchorHandled) {
            motionRef.current.anchorHandled = true
            if (!userMoved && initialHash && initialHash === window.location.hash) {
              measure()
              // The initial fragment can retain its pre-measurement CSS top
              // until the first paint. Use the same measured chapter coordinate
              // as the sampler for these controlled destinations.
              if (initialHash === '#finale' || initialHash === '#signature-key' || initialHash === '#finale-composition') {
                const point = staticMode || initialHash === '#finale' ? 0 : initialHash === '#signature-key' ? FINALE.detail : FINALE.composition
                const padding = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0
                window.scrollTo({ top: metrics.finaleTop + point * (metrics.finaleHeight - metrics.height) - padding, behavior: 'instant' })
              } else {
                document.getElementById(initialHash.slice(1))?.scrollIntoView({ behavior: 'instant', block: 'start' })
              }
              paint(window.scrollY)
            }
          }
        })
      })
    })
    return () => {
      cancelled = true
      cancelAnimationFrame(frameId)
      cancelAnimationFrame(anchorFrame)
      if (onLoad) window.removeEventListener('load', onLoad)
      observer.disconnect()
      inputEvents.forEach(event => window.removeEventListener(event, onInput))
      trigger.kill()
    }
  }, [chapter, construction, finale, finalePanel, hostRef, motionRef, onExploring, onRegion, staticMode, slot, sticky])
}
