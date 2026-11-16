/* oxlint-disable react/immutability -- R3F camera and controls are externally owned mutable Three.js objects. One frame owner coordinates intro, scroll and manual orbit. */
import { useEffect, useLayoutEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import gsap from 'gsap'
import { HERO_SHOT, INTRO_SHOT, captureOrbitShot, createShotFrame, fitShot } from './shots.js'
import { ASSEMBLED_BOUNDS } from '../keyboard/layers.js'

export default function CameraRig({ controls, ready, reducedMotion, visible, resetToken, motionRef }) {
  const { camera, size, invalidate } = useThree()
  const rig = useRef({
    intro: { ...INTRO_SHOT }, hero: { ...HERO_SHOT, targetY: 0.18 },
    frame: createShotFrame(), from: createShotFrame(),
    tween: null, introDone: false, initialized: false, owned: false, home: false,
  })

  useLayoutEffect(() => {
    if (!ready) return
    const orbit = controls.current
    const state = rig.current
    if (reducedMotion) {
      state.tween?.kill()
      state.introDone = true
      state.home = true
    }
    if (!state.initialized) {
      state.initialized = true
      if (reducedMotion || motionRef.current.pose.progress > 0) {
        state.introDone = true
        state.home = true
      } else {
        state.tween = gsap.to(state.intro, {
          ...HERO_SHOT, duration: 2.4, ease: 'power3.inOut', onUpdate: invalidate,
          onComplete: () => { state.introDone = true; state.home = true; invalidate() },
        })
      }
    }
    return () => { state.tween?.kill(); if (orbit) orbit.enabled = true }
  }, [controls, invalidate, motionRef, ready, reducedMotion])

  useLayoutEffect(() => {
    rig.current.home = true
    invalidate()
  }, [invalidate, resetToken, size.width, size.height])

  useEffect(() => {
    if (visible) rig.current.tween?.resume()
    else rig.current.tween?.pause()
  }, [visible, ready])

  useFrame(() => {
    if (!ready || !visible || !controls.current) return
    const state = rig.current
    const orbit = controls.current
    const pose = motionRef.current.pose
    if (pose.progress > 0) {
      if (!state.owned) {
        captureOrbitShot(camera, orbit.target, state.hero, state.from)
        state.owned = true
        state.tween?.kill()
        state.introDone = true
      }
      orbit.enabled = false
      fitShot(state.hero, camera.aspect, ASSEMBLED_BOUNDS, state.from)
      fitShot(pose.shot, camera.aspect, pose.bounds, state.frame)
      camera.position.lerpVectors(state.from.position, state.frame.position, pose.entry)
      camera.quaternion.slerpQuaternions(state.from.quaternion, state.frame.quaternion, pose.entry)
      camera.up.set(0, 1, 0).applyQuaternion(camera.quaternion)
      camera.fov = state.hero.fov + (pose.shot.fov - state.hero.fov) * pose.entry
      orbit.target.lerpVectors(state.from.target, state.frame.target, pose.entry)
    } else if (state.owned || !state.introDone || state.home) {
      const shot = state.owned ? state.hero : state.introDone ? HERO_SHOT : state.intro
      fitShot(shot, camera.aspect, ASSEMBLED_BOUNDS, state.frame)
      camera.position.copy(state.frame.position)
      camera.quaternion.copy(state.frame.quaternion)
      camera.up.copy(state.frame.up)
      camera.fov = shot.fov
      orbit.target.copy(state.frame.target)
      orbit.enabled = state.introDone
      if (state.introDone) {
        orbit.update()
        orbit.saveState()
        state.home = false
      }
      state.owned = false
    }
    camera.updateProjectionMatrix()
    camera.updateMatrixWorld()
  }, -0.8)

  return null
}
