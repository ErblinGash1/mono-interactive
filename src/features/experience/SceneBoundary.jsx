import { Component } from 'react'
import SceneFallback from './SceneFallback.jsx'

export default class SceneBoundary extends Component {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch() {
    this.props.onUnavailable?.()
  }

  render() {
    if (this.state.hasError) {
      return (
        <>
          {this.props.fallback ?? <SceneFallback />}
          <p className="scene-unavailable eyebrow" role="status">Static keyboard preview · 3D unavailable</p>
        </>
      )
    }
    return this.props.children
  }
}
