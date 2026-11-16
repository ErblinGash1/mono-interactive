import assert from 'node:assert/strict'
import test from 'node:test'
import { Mesh, MeshBasicMaterial, PerspectiveCamera, Raycaster, Vector3 } from 'three'
import { LAYERS, KEYS } from '../src/features/experience/keyboard/layout.js'
import { LAYER_DEFS } from '../src/features/experience/keyboard/layers.js'
import { createSlab } from '../src/features/experience/keyboard/geometry.js'
import { SWITCH_OPENINGS } from '../src/features/experience/keyboard/internals.js'
import { CHAPTER, chapterProgress, createSequenceState, sampleSequence } from '../src/features/experience/scene/sequence.js'
import { createShotFrame, fitShot } from '../src/features/experience/scene/shots.js'

test('seven layers retain their physical order throughout opening and closing', () => {
  assert.deepEqual(LAYER_DEFS.map(layer => layer.id), ['caps', 'switches', 'plate', 'foam', 'pcb', 'battery', 'base'])
  const pose = createSequenceState()
  for (let step = 0; step <= 1000; step++) {
    sampleSequence(step / 1000, pose)
    assert(pose.spread >= 0 && pose.spread <= 1)
    for (let i = 1; i < 7; i++) {
      const upper = LAYER_DEFS[i - 1]
      const lower = LAYER_DEFS[i]
      assert(LAYERS[upper.id] + upper.anchorY + pose.offsets[i - 1] >
        LAYERS[lower.id] + lower.anchorY + pose.offsets[i], 'Layer anchors never cross')
    }
  }
  sampleSequence(CHAPTER.inspect, pose)
  for (let i = 1; i < 7; i++) {
    const upper = LAYER_DEFS[i - 1]
    const lower = LAYER_DEFS[i]
    const gap = LAYERS[upper.id] + upper.min + pose.offsets[i - 1] -
      (LAYERS[lower.id] + lower.max + pose.offsets[i])
    assert(gap > 1, 'The fully separated components have an inspectable gap')
  }
})

test('sequence boundaries are clamped, continuous, and have a genuine inspection hold', () => {
  assert.equal(sampleSequence(-1).progress, 0)
  assert.equal(sampleSequence(NaN).progress, 0)
  assert.equal(sampleSequence(Infinity).progress, 1)
  assert.equal(sampleSequence(0).spread, 0)
  assert.equal(sampleSequence(CHAPTER.enterEnd).spread, 0)
  assert.equal(sampleSequence(CHAPTER.openEnd).spread, 1)
  assert.equal(sampleSequence(CHAPTER.holdEnd).spread, 1)
  assert.equal(sampleSequence(1).spread, 0)
  assert.equal(sampleSequence(0).labels, 0)
  assert.equal(sampleSequence(1).labels, 0)
  assert.equal(sampleSequence(0.1).interaction, 0)
  for (const boundary of [0.24, 0.58, 0.83, 1]) {
    const left = sampleSequence(boundary - 0.000001)
    const right = sampleSequence(boundary + 0.000001)
    for (let i = 0; i < 7; i++) assert(Math.abs(left.offsets[i] - right.offsets[i]) < 0.0001)
    assert(Math.abs(left.shot.azimuth - right.shot.azimuth) < 0.0001)
  }
})

test('sampling reverses exactly and reuses the same output buffers', () => {
  const pose = createSequenceState()
  const offsets = pose.offsets
  const bounds = pose.bounds
  const shot = pose.shot
  const expected = structuredClone(sampleSequence(0.43))
  sampleSequence(0.94, pose)
  sampleSequence(0.43, pose)
  assert.deepEqual(pose, expected)
  assert.strictEqual(pose.offsets, offsets)
  assert.strictEqual(pose.bounds, bounds)
  assert.strictEqual(pose.shot, shot)
  assert.equal(chapterProgress(100, 1000, 3600, 900), 0)
  assert.equal(chapterProgress(3700, 1000, 3600, 900), 1)
  assert.equal(chapterProgress(100 + CHAPTER.inspect * 3600, 1000, 3600, 900), CHAPTER.inspect)
  assert.equal(chapterProgress(0, 950, 4000, 1000), 0, 'A tall viewport still starts in the assembled hero')
  assert.equal(chapterProgress(3950, 950, 4000, 1000), 1)
})

test('expanded and intermediate camera shots fit all component bounds', () => {
  const pose = createSequenceState()
  const frame = createShotFrame()
  for (const aspect of [0.5, 0.8, 1, 1.4, 2.2]) {
    for (const progress of [0, 0.1, 0.24, 0.35, 0.5, 0.67, 0.83, 0.9, 1]) {
      sampleSequence(progress, pose)
      assert.strictEqual(fitShot(pose.shot, aspect, pose.bounds, frame), frame)
      const camera = new PerspectiveCamera(pose.shot.fov, aspect, 0.1, 100)
      camera.position.copy(frame.position)
      camera.quaternion.copy(frame.quaternion)
      camera.updateMatrixWorld(true)
      for (const x of [-pose.bounds.width / 2, pose.bounds.width / 2]) {
        for (const y of [pose.bounds.minY, pose.bounds.maxY]) {
          for (const z of [-pose.bounds.depth / 2, pose.bounds.depth / 2]) {
            const point = new Vector3(x, y, z).project(camera)
            assert(Math.abs(point.x) < 0.96 && Math.abs(point.y) < 0.96, 'Every layer remains in frame')
            assert(point.z > -1 && point.z < 1)
          }
        }
      }
    }
  }
})

test('plate and foam have real switch apertures, not a painted grid', () => {
  const material = new MeshBasicMaterial()
  for (const height of [0.065, 0.18]) {
    const geometry = createSlab(16.67, 6.18, height, 0.12, 0, SWITCH_OPENINGS)
    const mesh = new Mesh(geometry, material)
    for (const key of KEYS) {
      const hits = new Raycaster(new Vector3(key.x, 2, key.z), new Vector3(0, -1, 0)).intersectObject(mesh)
      assert.equal(hits.length, 0, key.id + ' has a clear aperture')
    }
    assert(new Raycaster(new Vector3(-8.30, 2, 0), new Vector3(0, -1, 0)).intersectObject(mesh).length > 0,
      'The web around the apertures remains solid')
    geometry.dispose()
  }
  material.dispose()
})
