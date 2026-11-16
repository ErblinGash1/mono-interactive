export default function ArrowIcon({ diagonal = false, className = '' }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d={diagonal ? 'M5 19 19 5M5 5h14v14' : 'M4 12h15m-6-6 6 6-6 6'} />
    </svg>
  )
}
