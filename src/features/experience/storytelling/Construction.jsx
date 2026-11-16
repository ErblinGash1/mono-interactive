import ArrowIcon from '../../../components/ui/ArrowIcon.jsx'
import { LAYER_DEFS } from '../keyboard/layers.js'

const summaries = [
  'Dished, tapered caps with satin surfaces and crisp legends.',
  'Spring-loaded cross stems, contact pins, and stabilizers.',
  'Perforated aluminium aligns each switch and stabilizer.',
  'A porous sheet separates the mounting plate and electronics.',
  'Copper traces link plated contacts, LEDs, and control packages.',
  'Foil-wrapped cells with insulating tabs and paired power leads.',
  'A hollow aluminium tray with mounting bosses and rubber feet.',
]

export default function Construction({ sectionRef, selected, onSelect }) {
  const layer = LAYER_DEFS[selected]
  return (
    <section id="construction" ref={sectionRef} className="construction-chapter page-gutter" aria-labelledby="construction-title">
      <span id="construction-inspect" className="construction-inspect-anchor" aria-hidden="true" />
      <div className="construction-panel">
        <div className="construction-intro">
          <p className="eyebrow text-ember">02 / Inside MONO</p>
          <h2 id="construction-title">Every layer.<br /><span>A reason.</span></h2>
          <p className="construction-description">A closer look at the considered whole. Scroll to separate the seven layers, then choose a component to explore.</p>
        </div>
        <div className="construction-details">
          <div className="layer-readout" aria-live="polite" aria-atomic="true">
            <p className="eyebrow text-ember">{String(selected + 1).padStart(2, '0')} / Construction notes</p>
            <h3>{layer.label}</h3>
            <p className="layer-description desktop-summary">{layer.description}</p>
            <p className="layer-description mobile-summary">{summaries[selected]}</p>
          </div>
          <ol className="layer-picker" aria-label="Keyboard components">
            {LAYER_DEFS.map((item, index) => (
              <li key={item.id}>
                <button type="button" aria-label={item.label} aria-pressed={selected === index}
                  onClick={() => onSelect(index)}>{String(index + 1).padStart(2, '0')}</button>
              </li>
            ))}
          </ol>
          <div className="construction-links">
            <a href="#construction-inspect" className="text-link">Inspect the layers <ArrowIcon diagonal /></a>
            <a href="#overview" className="text-link">Continue the story <span aria-hidden="true">↓</span></a>
          </div>
        </div>
        <span className="construction-footnote eyebrow">M—01 / An illustrative construction study</span>
      </div>
    </section>
  )
}
