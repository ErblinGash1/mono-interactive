import assert from 'node:assert/strict'
import test from 'node:test'
import { PerspectiveCamera, Vector3 } from 'three'
import { KEYS, LAYERS } from '../src/features/experience/keyboard/layout.js'
import { createSequenceState, sampleSequence } from '../src/features/experience/scene/sequence.js'
import { FINALE, SIGNATURE_KEY, keyWave, sampleFinale } from '../src/features/experience/scene/finale.js'
import { createShotFrame, fitShot } from '../src/features/experience/scene/shots.js'

test('finale starts at the construction endpoint, keeps all seven layers assembled, and resets on return', () => {
  const pose = createSequenceState()
  const construction = structuredClone(sampleSequence(1, pose))
  sampleFinale(0, pose)
  for (const key of Object.keys(construction.shot)) assert(Math.abs(pose.shot[key] - construction.shot[key]) < 1e-12)
  assert.deepEqual(pose.bounds, construction.bounds)
  assert(SIGNATURE_KEY.accent && SIGNATURE_KEY.id === 'esc')
  for (let step = 0; step <= 1000; step++) {
    sampleFinale(step / 1000, pose)
    assert.equal(pose.spread, 0)
    assert(pose.offsets.every(offset => offset === 0))
    assert.equal(pose.labels, 0)
    assert.equal(pose.interaction, 0)
  }
  sampleSequence(0, pose)
  assert.equal(pose.signature.progress, -1)
  assert.equal(pose.signature.cap, 0)
  assert.equal(pose.signature.press, 0)
  assert.equal(pose.signature.waveStrength, 0)
  assert.equal(pose.signature.springScale, 1)
  assert.equal(pose.shot.targetX, 0)
})

test('signature separates with clear vertical gaps and fully reassembles before the keypress', () => {
  const pose = sampleFinale(FINALE.detail, createSequenceState())
  const s = pose.signature
  const capBottom = LAYERS.caps + s.cap
  const stemTop = LAYERS.switches + 0.105 + s.stem + 0.06
  const housingBottom = LAYERS.switches + 0.02 + s.housing - 0.06
  const springTop = LAYERS.switches + 0.055 + s.spring + 0.092 * s.springScale
  assert(capBottom - stemTop > 0.7)
  assert(housingBottom - springTop > 0.1)
  for (const p of [0.57, 0.60, FINALE.press, 0.70, 1]) {
    const signature = sampleFinale(p, pose).signature
    assert.equal(signature.cap + signature.stem + signature.spring + signature.housing, 0)
    assert(signature.press >= 0 && signature.press <= 0.13)
  }
  assert.equal(sampleFinale(FINALE.press, pose).signature.press, 0.13)
  assert.equal(sampleFinale(0.71, pose).signature.press, 0)
  assert.equal(sampleFinale(1, pose).signature.springScale, 1)
})

test('finale boundaries are continuous, exactly reversible, and reuse every pose buffer', () => {
  const pose = createSequenceState()
  const identity = [pose.offsets, pose.bounds, pose.shot, pose.signature]
  const expected = structuredClone(sampleFinale(0.35, pose))
  sampleFinale(0.96, pose)
  sampleFinale(0.35, pose)
  assert.deepEqual(pose, expected)
  assert.deepEqual([pose.offsets, pose.bounds, pose.shot, pose.signature], identity)
  for (let index = 0; index < identity.length; index++) assert.strictEqual([pose.offsets, pose.bounds, pose.shot, pose.signature][index], identity[index])
  for (const boundary of [0, 0.16, 0.18, 0.30, 0.43, 0.57, 0.60, 0.64, 0.66, 0.69, 0.71, 0.86, 0.90, 0.94, 1]) {
    const left = structuredClone(sampleFinale(boundary - 1e-7, pose))
    const right = sampleFinale(boundary + 1e-7, pose)
    for (const key of Object.keys(left.shot)) assert(Math.abs(left.shot[key] - right.shot[key]) < 0.0001)
    for (const key of Object.keys(left.signature)) assert(Math.abs(left.signature[key] - right.signature[key]) < 0.0001)
  }
  assert.equal(sampleFinale(-Infinity, pose).signature.progress, 0)
  assert.equal(sampleFinale(Infinity, pose).signature.progress, 1)
})

test('light wave reaches each key and returns to darkness at both boundaries', () => {
  const pose = createSequenceState()
  for (const key of KEYS) {
    assert.equal(keyWave(key, sampleFinale(0, pose).signature), 0)
    assert.equal(keyWave(key, sampleFinale(1, pose).signature), 0)
    let peak = 0
    for (let step = 690; step <= 920; step++) {
      const strength = keyWave(key, sampleFinale(step / 1000, pose).signature)
      assert(strength >= 0 && strength <= 1)
      peak = Math.max(peak, strength)
    }
    assert(peak > 0.3, key.id + ' receives the travelling signal')
  }
})

test('off-center detail and final shots frame their intended bounds without near clipping', () => {
  const pose = createSequenceState()
  const frame = createShotFrame()
  for (const aspect of [0.5, 0.8, 1, 1.8, 2.5]) {
    for (const progress of [0, 0.1, 0.18, 0.35, 0.64, 0.75, 0.90, 1]) {
      sampleFinale(progress, pose)
      fitShot(pose.shot, aspect, pose.bounds, frame)
      const camera = new PerspectiveCamera(pose.shot.fov, aspect, 0.1, 100)
      camera.position.copy(frame.position)
      camera.quaternion.copy(frame.quaternion)
      camera.updateMatrixWorld(true)
      for (const x of [-1, 1]) for (const z of [-1, 1]) for (const y of [pose.bounds.minY, pose.bounds.maxY]) {
        const point = new Vector3(pose.bounds.centerX + x * pose.bounds.width / 2, y,
          pose.bounds.centerZ + z * pose.bounds.depth / 2).project(camera)
        assert(Math.abs(point.x) < 0.96 && Math.abs(point.y) < 0.96)
        assert(point.z > -1 && point.z < 1)
      }
    }
  }
})
