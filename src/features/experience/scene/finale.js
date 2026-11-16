import { KEYS } from '../keyboard/layout.js'
import { ASSEMBLED_BOUNDS } from '../keyboard/layers.js'
import { clamp01, easeRange, NEXT_SHOT, sampleSequence } from './sequence.js'

export const SIGNATURE_KEY = KEYS.find(key => key.id === 'esc')
export const FINALE = { detail: 0.35, press: 0.64, composition: 0.95 }
export const DETAIL_SHOT = { azimuth: -0.95, elevation: 0.62, roll: -0.035, fov: 30, pullback: 1.05 }
export const FINAL_SHOT = { azimuth: -0.16, elevation: 0.88, roll: -0.13, fov: 32, pullback: 1.03 }
const CHANNELS = ['azimuth', 'elevation', 'roll', 'fov', 'pullback']
const mix = (a, b, t) => a + (b - a) * t

// One pose buffer, including the existing seven layer channels. No tween state
// or previous-frame values are used by this continuation of the story.
export function sampleFinale(progress, out) {
  sampleSequence(1, out)
  const p = clamp01(progress)
  const signature = out.signature
  const focus = easeRange(0, 0.18, p)
  const returnWide = easeRange(0.64, 0.90, p)
  const detail = focus * (1 - returnWide)
  const separation = easeRange(0.16, 0.30, p) * (1 - easeRange(0.43, 0.57, p))
  const press = easeRange(0.60, 0.64, p) * (1 - easeRange(0.66, 0.71, p))
  signature.progress = p
  signature.detail = detail
  signature.cap = separation * 2
  signature.stem = separation * 1.2
  signature.housing = separation
  signature.spring = separation * 0.55
  signature.springScale = 1 + separation * 1.4 - press * 0.35
  signature.press = press * 0.13
  signature.flash = press * (1 - easeRange(0.66, 0.73, p))
  signature.wave = easeRange(0.69, 0.90, p)
  signature.waveStrength = easeRange(0.685, 0.72, p) * (1 - easeRange(0.87, 0.92, p))
  signature.complete = easeRange(0.86, 0.94, p)
  out.bounds.width = mix(ASSEMBLED_BOUNDS.width, 3.6, detail)
  out.bounds.depth = mix(ASSEMBLED_BOUNDS.depth, 2.7, detail)
  out.bounds.maxY = mix(1, 3.1, detail)
  out.bounds.centerX = detail === 0 ? 0 : SIGNATURE_KEY.x * detail
  out.bounds.centerZ = detail === 0 ? 0 : SIGNATURE_KEY.z * detail
  for (const key of CHANNELS) {
    out.shot[key] = mix(mix(NEXT_SHOT[key], DETAIL_SHOT[key], focus), FINAL_SHOT[key], returnWide)
  }
  out.shot.targetX = out.bounds.centerX
  out.shot.targetZ = out.bounds.centerZ
  out.shot.targetY = mix(0.18, 1.25, detail)
  return out
}

// A narrow travelling band, with exact darkness outside its support. Shared
// by the instanced cap colors and existing under-key light pools.
export function keyWave(key, signature) {
  if (signature.waveStrength === 0) return 0
  const travel = -10 + signature.wave * 20
  const distance = Math.abs(key.x + key.z * 0.18 - travel)
  const band = Math.max(0, 1 - distance / 2.1)
  return band * band * signature.waveStrength
}
