import { useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { ACESFilmicToneMapping, PCFSoftShadowMap } from 'three'
import KeyboardModel from './keyboard/KeyboardModel.jsx'
import CameraRig from './scene/CameraRig.jsx'
import StudioLighting from './scene/StudioLighting.jsx'
import SceneFallback from './SceneFallback.jsx'
import CalloutProjector from './storytelling/CalloutProjector.jsx'

export default function ProductScene({ motionRef, exploring, fallbackExploded, reducedMotion, calloutElements, onUnavailable }) {
  const controls = useRef(null)
  const viewport = useRef(null)
  const renderState = useRef(null)
  const renderAllowed = useRef(true)
  const pointer = useRef({ x: 0, y: 0, active: false, dragging: false })
  const [rotating, setRotating] = useState(false)
  const [visible, setVisible] = useState(true)
  const [ready, setReady] = useState(false)
  const [resetToken, setResetToken] = useState(0)
  const [contextLost, setContextLost] = useState(false)

  useEffect(() => {
    let intersecting = true
    const update = () => setVisible(intersecting && !document.hidden)
    const observer = new IntersectionObserver(([entry]) => { intersecting = entry.isIntersecting; update() })
    observer.observe(viewport.current)
    document.addEventListener('visibilitychange', update)
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', update) }
  }, [])

  useEffect(() => {
    if (contextLost) return
    const canvas = renderState.current?.gl.domElement
    if (!canvas) return
    const onLost = (event) => {
      event.preventDefault()
      motionRef.current.invalidate = null
      setContextLost(true)
      onUnavailable()
    }
    canvas.addEventListener('webglcontextlost', onLost)
    return () => canvas.removeEventListener('webglcontextlost', onLost)
  }, [ready, contextLost, motionRef, onUnavailable])

  useEffect(() => {
    if (exploring) {
      pointer.current.active = false
      pointer.current.x = pointer.current.y = 0
    }
  }, [exploring])

  useEffect(() => {
    const shared = motionRef.current
    return () => { shared.invalidate = null; renderAllowed.current = false }
  }, [motionRef])

  useEffect(() => {
    // Scroll sampling continues through editorial sections, but an offscreen
    // canvas needs no GPU frame. Re-entry renders the latest deterministic pose.
    renderAllowed.current = visible && !contextLost
    if (visible && ready && !contextLost) renderState.current?.invalidate()
  }, [contextLost, motionRef, ready, visible])

  const clearPointer = () => {
    pointer.current.active = false
    pointer.current.x = pointer.current.y = 0
    renderState.current?.invalidate()
  }

  if (contextLost) return (
    <div ref={viewport} className="product-scene">
      <SceneFallback exploded={fallbackExploded} />
      <p className="scene-unavailable eyebrow" role="status">Static keyboard preview · 3D interrupted</p>
    </div>
  )

  return (
    <div ref={viewport} className="product-scene" data-scene-ready={ready} data-reduced-motion={reducedMotion}>
      <div className="canvas-wrap" aria-hidden="true"
        onPointerMove={(event) => {
          if (reducedMotion || exploring || event.pointerType !== 'mouse') return
          const rect = event.currentTarget.getBoundingClientRect()
          pointer.current.x = Math.max(-1, Math.min(1, (event.clientX - rect.left) / rect.width * 2 - 1))
          pointer.current.y = Math.max(-1, Math.min(1, (event.clientY - rect.top) / rect.height * 2 - 1))
          pointer.current.active = true
          renderState.current?.invalidate()
        }}
        onPointerLeave={clearPointer} onPointerCancel={clearPointer}>
        <Canvas camera={{ position: [-10, 16, 22], fov: 32, near: 0.1, far: 100 }}
          shadows={{ type: PCFSoftShadowMap }} dpr={[1, 1.5]} frameloop={visible ? 'demand' : 'never'}
          gl={{ antialias: true, alpha: true, powerPreference: 'low-power', toneMapping: ACESFilmicToneMapping, toneMappingExposure: 1.08 }}
          onCreated={(state) => {
            renderState.current = state
            motionRef.current.invalidate = () => { if (renderAllowed.current) state.invalidate() }
            state.invalidate()
          }}
          fallback={<><SceneFallback exploded={fallbackExploded} /><p className="scene-unavailable eyebrow">Static keyboard preview · WebGL unavailable</p></>}>
          <StudioLighting motionRef={motionRef} />
          <KeyboardModel pointer={pointer} reducedMotion={reducedMotion} visible={visible} onReady={setReady} motionRef={motionRef} />
          <OrbitControls ref={controls} makeDefault enablePan={false} enableZoom={false}
            enableDamping={!reducedMotion && !exploring} dampingFactor={0.08}
            autoRotate={ready && rotating && !reducedMotion && visible && !exploring} autoRotateSpeed={0.55}
            minPolarAngle={Math.PI / 7} maxPolarAngle={Math.PI / 2.2}
            onStart={() => { pointer.current.dragging = true; pointer.current.active = false }}
            onEnd={() => { pointer.current.dragging = false }}
          />
          <CameraRig controls={controls} ready={ready} reducedMotion={reducedMotion} visible={visible} resetToken={resetToken} motionRef={motionRef} />
          <CalloutProjector motionRef={motionRef} elementsRef={calloutElements} />
        </Canvas>
        {!ready && <SceneFallback exploded={fallbackExploded} />}
      </div>
      <div className="scene-controls">
        <span className="eyebrow scene-hint">Drag to orbit · Hover to explore</span>
        <button type="button" className="scene-control" disabled={!ready || exploring} onClick={() => {
          setRotating(false)
          clearPointer()
          setResetToken((current) => current + 1)
        }}>Reset view <span aria-hidden="true">↗</span></button>
        <button type="button" className="scene-control rotation-control"
          aria-pressed={rotating && !reducedMotion} disabled={reducedMotion || !ready || exploring}
          title={reducedMotion ? 'Automatic rotation is disabled by your reduced-motion preference' : 'Toggle automatic rotation'}
          onClick={() => { clearPointer(); setRotating((current) => !current) }}>
          {rotating && !reducedMotion ? 'Pause' : 'Rotate'} <span aria-hidden="true">{rotating && !reducedMotion ? 'Ⅱ' : '↻'}</span>
        </button>
      </div>
    </div>
  )
}
