import { LAYERS } from '../keyboard/layout.js'
import { ASSEMBLED_BOUNDS, LAYER_DEFS } from '../keyboard/layers.js'
import { HERO_SHOT } from './presets.js'

export const CHAPTER = { enterEnd: 0.24, openEnd: 0.58, holdEnd: 0.83, end: 1, inspect: 0.67 }
export const EXPLODED_SHOT = { azimuth: -0.42, elevation: 0.38, roll: -0.015, fov: 33, pullback: 1 }
export const NEXT_SHOT = { azimuth: 0.12, elevation: 0.72, roll: 0.035, fov: 32, pullback: 1 }
const SHOT_CHANNELS = ['azimuth', 'elevation', 'roll', 'fov', 'pullback']

export const clamp01 = (value) => Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : value === Infinity ? 1 : 0
export function easeRange(start, end, value) {
  const t = clamp01((value - start) / (end - start))
  return t * t * (3 - 2 * t)
}

export function createSequenceState() {
  return {
    progress: 0, entry: 0, spread: 0, labels: 0, interaction: 1,
    offsets: new Float64Array(LAYER_DEFS.length),
    bounds: { ...ASSEMBLED_BOUNDS }, shot: { ...HERO_SHOT, targetY: 0.18 },
    signature: { progress: -1, cap: 0, stem: 0, housing: 0, spring: 0, springScale: 1, press: 0, flash: 0, wave: -1, waveStrength: 0, complete: 0, detail: 0 },
  }
}

// Pure, reversible and allocation-free when supplied an output object.
// No previous frame, scroll direction, elapsed time, or GSAP state is required.
export function sampleSequence(progress, out = createSequenceState()) {
  const p = clamp01(progress)
  out.progress = p
  const signature = out.signature
  signature.progress = -1
  signature.cap = signature.stem = signature.housing = signature.spring = signature.press = signature.flash = signature.waveStrength = signature.complete = signature.detail = 0
  signature.springScale = 1
  signature.wave = -1
  out.bounds.centerX = out.bounds.centerZ = 0
  out.shot.targetX = out.shot.targetZ = 0
  out.entry = easeRange(0, CHAPTER.enterEnd, p)
  out.spread = easeRange(CHAPTER.enterEnd, CHAPTER.openEnd, p) * (1 - easeRange(CHAPTER.holdEnd, 1, p))
  out.labels = easeRange(0.47, 0.58, p) * (1 - easeRange(0.82, 0.91, p))
  out.interaction = 1 - easeRange(0, 0.055, p)
  let minY = Infinity
  let maxY = -Infinity
  for (let i = 0; i < LAYER_DEFS.length; i++) {
    const layer = LAYER_DEFS[i]
    const offset = layer.offset * out.spread
    out.offsets[i] = offset
    minY = Math.min(minY, LAYERS[layer.id] + layer.min + offset)
    maxY = Math.max(maxY, LAYERS[layer.id] + layer.max + offset)
  }
  out.bounds.minY = minY
  out.bounds.maxY = Math.max(1, maxY)
  const exit = easeRange(CHAPTER.holdEnd, 1, p)
  for (const key of SHOT_CHANNELS) {
    const exploration = HERO_SHOT[key] + (EXPLODED_SHOT[key] - HERO_SHOT[key]) * out.entry
    out.shot[key] = exploration + (NEXT_SHOT[key] - exploration) * exit
  }
  out.shot.targetY = 0.18 + ((minY + maxY) / 2 - 0.18) * out.spread
  return out
}

export function chapterProgress(scrollY, top, height, viewportHeight) {
  const start = Math.max(0, top - viewportHeight)
  const end = top + height - viewportHeight
  return clamp01((scrollY - start) / Math.max(1, end - start))
}
