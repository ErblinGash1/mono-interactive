import { useCallback, useRef, useState } from 'react'
import { useReducedMotion } from '../../hooks/useReducedMotion.js'
import Hero from './Hero.jsx'
import SceneStage from './SceneStage.jsx'
import Construction from './storytelling/Construction.jsx'
import Finale from './storytelling/Finale.jsx'
import Story from '../story/Story.jsx'
import { useSceneScroll } from './storytelling/useSceneScroll.js'
import { createSequenceState } from './scene/sequence.js'
import './storytelling/construction.css'

export default function Experience() {
  const chapter = useRef(null)
  const slot = useRef(null)
  const construction = useRef(null)
  const sticky = useRef(null)
  const finale = useRef(null)
  const finalePanel = useRef(null)
  const hostRef = useRef(null)
  const motionRef = useRef({ pose: createSequenceState(), invalidate: null, metrics: null, layers: [], callouts: null })
  const reducedMotion = useReducedMotion()
  const [exploring, setExploring] = useState(false)
  const [region, setRegion] = useState('hero')
  const [selected, setSelected] = useState(0)
  const [unavailable, setUnavailable] = useState(false)
  const onUnavailable = useCallback(() => setUnavailable(true), [])
  const staticMode = reducedMotion || unavailable

  useSceneScroll({ chapter, slot, construction, finale, finalePanel, sticky, hostRef, motionRef, staticMode, onExploring: setExploring, onRegion: setRegion })

  return (
    <div className="experience-chapter" ref={chapter} data-reduced-motion={reducedMotion} data-static-construction={staticMode}>
      <Hero sceneSlot={slot} />
      <div className="experience-visual-track">
        <div className="experience-sticky" ref={sticky}>
          <div className="experience-scene-host" ref={hostRef}>
            <SceneStage motionRef={motionRef} exploring={exploring} fallbackExploded={region === 'construction'} selected={selected} onSelect={setSelected} reducedMotion={reducedMotion} onUnavailable={onUnavailable} />
          </div>
        </div>
      </div>
      <Construction sectionRef={construction} selected={selected} onSelect={setSelected} />
      <Story />
      <Finale sectionRef={finale} panelRef={finalePanel} />
    </div>
  )
}
