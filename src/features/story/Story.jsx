import ArrowIcon from '../../components/ui/ArrowIcon.jsx'
import './story.css'

const principles = [
  { number: '01', title: 'Quiet by design.', description: 'A simple silhouette. A deliberate proportion. A visual language that gives every detail room to breathe.', detail: 'Form / Subtract the unnecessary' },
  { number: '02', title: 'Material matters.', description: 'Graphite tones, soft highlights, and a single ember accent. An exploration of how light brings a surface to life.', detail: 'Material / Find the contrast' },
  { number: '03', title: 'Made to explore.', description: 'An invitation to slow down and look closer. Small, considered interactions that connect the object and the screen.', detail: 'Interaction / Follow your curiosity' },
]

export default function Story() {
  return (
    <>
      <section id="overview" className="overview page-gutter" aria-labelledby="overview-title">
        <div className="section-kicker eyebrow" data-reveal><span className="text-ember">03</span> / The idea</div>
        <div className="overview-content" data-reveal>
          <h2 id="overview-title">A little less.<br /><span>A lot more considered.</span></h2>
          <div className="overview-body">
            <p>MONO explores what happens when hardware is treated as an experience. Form, light, and motion come together in a single, focused object.</p>
            <p className="text-muted">Meet M—01, a mechanical keyboard concept shaped around the essentials. Explore the sculpted keys, the graphite enclosure, and the details that give it character.</p>
          </div>
        </div>
      </section>
      <section id="design-notes" className="design-notes page-gutter" aria-labelledby="notes-title">
        <div className="notes-heading" data-reveal>
          <div className="section-kicker eyebrow"><span className="text-ember">04</span> / Design notes</div>
          <h2 id="notes-title">The thinking behind the feeling.</h2>
          <span className="eyebrow text-muted">Three guiding principles</span>
        </div>
        <div className="principle-grid">
          {principles.map(({ number, title, description, detail }) => (
            <article className="principle" key={number} data-reveal>
              <div className="principle-number eyebrow">{number}<ArrowIcon diagonal /></div>
              <h3>{title}</h3>
              <p>{description}</p>
              <span className="principle-detail eyebrow">{detail}</span>
            </article>
          ))}
        </div>
      </section>
    </>
  )
}
