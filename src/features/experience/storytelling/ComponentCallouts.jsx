import { useLayoutEffect, useRef } from 'react'
import { LAYER_DEFS } from '../keyboard/layers.js'

export default function ComponentCallouts({ motionRef, selected, onSelect, elementsRef }) {
  const root = useRef(null)
  useLayoutEffect(() => {
    const shared = motionRef.current
    shared.callouts = root.current
    return () => { shared.callouts = null }
  }, [motionRef])
  return (
    <div className="component-callouts" ref={root} inert>
      <svg className="component-leaders" aria-hidden="true">
        {LAYER_DEFS.map((layer, index) => (
          <g key={layer.id} className={selected === index ? 'is-selected' : ''}>
            <path ref={element => { elementsRef.current.paths[index] = element }} fill="none" />
            <circle ref={element => { elementsRef.current.dots[index] = element }} r={selected === index ? 3 : 2} />
          </g>
        ))}
      </svg>
      <ol aria-label="Exploded keyboard components">
        {LAYER_DEFS.map((layer, index) => (
          <li key={layer.id} style={{ '--layer-index': index }}>
            <button type="button" ref={element => { elementsRef.current.buttons[index] = element }}
              aria-pressed={selected === index} onClick={() => onSelect(index)}>
              <span className="eyebrow">{String(index + 1).padStart(2, '0')}</span>
              <span>{layer.label}</span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  )
}
