import ArrowIcon from '../../components/ui/ArrowIcon.jsx'
import './experience.css'

export default function Hero({ sceneSlot }) {
  return (
    <section id="experience" className="hero page-gutter" aria-labelledby="hero-title">
      <div className="hero-topline eyebrow" data-intro>
        <span><span className="status-dot" /> MONO — Interactive hardware experience</span>
        <span className="hero-edition">Concept study / No. 001</span>
      </div>
      <div className="hero-main">
        <div className="hero-copy">
          <p className="eyebrow text-ember" data-intro>Purpose in every detail.</p>
          <h1 id="hero-title" data-intro>Less noise.<br />More <span>signal.</span></h1>
          <p className="hero-description" data-intro>
            A mechanical keyboard, reduced to its essentials. Considered materials. Deliberate details. A quieter kind of presence.
          </p>
          <div className="hero-actions" data-intro>
            <a className="button-primary" href="#construction">Explore the construction <ArrowIcon /></a>
            <a className="text-link" href="#design-notes">Behind the design <ArrowIcon diagonal /></a>
          </div>
          <div className="hero-caption eyebrow" data-intro>
            <span className="caption-line" aria-hidden="true" />
            Designed to be felt.<br />Built to be explored.
          </div>
        </div>
        <div className="scene-slot" ref={sceneSlot} aria-hidden="true" />
      </div>
      <div className="hero-bottomline eyebrow" data-intro>
        <a href="#construction" className="scroll-cue"><span aria-hidden="true">↓</span> Scroll to discover</a>
        <span>Form. Material. Interaction.</span>
        <span className="hero-bottom-index">001 — An ongoing exploration</span>
      </div>
    </section>
  )
}
