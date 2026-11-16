import ArrowIcon from '../ui/ArrowIcon.jsx'

export default function SiteFooter() {
  return (
    <footer className="site-footer page-gutter">
      <a className="wordmark" href="#experience" aria-label="MONO, back to top">mono<span className="wordmark-dot">+</span></a>
      <p className="eyebrow">An independent exploration of form & interaction.</p>
      <a className="text-link" href="#experience">Back to top <ArrowIcon diagonal /></a>
    </footer>
  )
}
