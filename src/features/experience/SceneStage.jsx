import { lazy, Suspense, useRef } from 'react'
import SceneBoundary from './SceneBoundary.jsx'
import SceneFallback from './SceneFallback.jsx'
import ComponentCallouts from './storytelling/ComponentCallouts.jsx'

const ProductScene = lazy(() => import('./ProductScene.jsx'))

export default function SceneStage({ motionRef, exploring, fallbackExploded, selected, onSelect, reducedMotion, onUnavailable }) {
  const calloutElements = useRef({ buttons: [], paths: [], dots: [] })
  return (
    <figure className="scene-stage" aria-label="MONO M—01: an interactive graphite mechanical keyboard with sculpted keycaps, ember accents, and a rotary dial" data-intro>
      <div className="stage-grid" aria-hidden="true" />
      <div className="stage-cross stage-cross-start" aria-hidden="true">+</div>
      <div className="stage-cross stage-cross-end" aria-hidden="true">+</div>
      <span className="stage-index" aria-hidden="true">M—01</span>
      <div className="scene-viewport">
        <SceneBoundary fallback={<SceneFallback exploded={fallbackExploded} />} onUnavailable={onUnavailable}>
          <Suspense fallback={<SceneFallback exploded={fallbackExploded} />}>
            <ProductScene motionRef={motionRef} exploring={exploring} fallbackExploded={fallbackExploded} reducedMotion={reducedMotion} calloutElements={calloutElements} onUnavailable={onUnavailable} />
          </Suspense>
        </SceneBoundary>
        <ComponentCallouts motionRef={motionRef} selected={selected} onSelect={onSelect} elementsRef={calloutElements} />
      </div>
      <figcaption className="stage-caption">
        <div><span className="eyebrow text-ember">01 / MONO M—01</span><p>Mechanical keyboard · Graphite / Ember</p></div>
        <span className="product-badge eyebrow">82-key concept</span>
      </figcaption>
    </figure>
  )
}
