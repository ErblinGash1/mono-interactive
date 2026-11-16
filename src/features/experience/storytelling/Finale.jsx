import ArrowIcon from '../../../components/ui/ArrowIcon.jsx'
import './finale.css'

export default function Finale({ sectionRef, panelRef }) {
  return (
    <section id="finale" ref={sectionRef} className="finale-chapter page-gutter" aria-labelledby="finale-title">
      <span id="signature-key" className="finale-anchor" aria-hidden="true" />
      <span id="finale-composition" className="finale-anchor" aria-hidden="true" />
      <div className="finale-panel" ref={panelRef}>
        <div className="finale-signature">
          <p className="eyebrow text-ember">05 / A considered response</p>
          <h2>A small detail.<br /><span>A deeper feeling.</span></h2>
          <p className="finale-description">One ember key. A sculpted cap, a cross stem, a steel return spring. Separate the parts. Feel how they come together.</p>
          <div className="signature-index" role="group" aria-label="Escape key construction">
            <span><i />01 / Sculpted cap</span>
            <span><i />02 / Cross stem & housing</span>
            <span><i />03 / Return spring</span>
          </div>
        </div>
        <div className="finale-completion">
          <p className="eyebrow text-ember">MONO M—01 / Graphite & ember</p>
          <h2 id="finale-title">Make room<br />for <span>feeling.</span></h2>
          <p className="finale-description">Considered in every layer. Expressive in every detail. A mechanical keyboard concept made to reward a closer look.</p>
        </div>
        <div className="finale-bottom">
          <div className="finale-cue" aria-hidden="true"><span className="eyebrow text-ember">01 / Separate</span><span className="finale-cue-line" /></div>
          <div className="finale-actions">
            <a className="button-primary" href="#construction-inspect">Explore M—01 <ArrowIcon /></a>
            <a className="text-link" href="#experience">Back to the beginning <ArrowIcon diagonal /></a>
          </div>
          <a className="finale-skip text-link" href="#finale-composition">Skip to final view <span aria-hidden="true">↓</span></a>
          <p className="finale-footnote eyebrow">An independent concept. An invitation to explore.</p>
        </div>
      </div>
    </section>
  )
}
