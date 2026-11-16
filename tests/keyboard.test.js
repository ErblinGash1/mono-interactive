import assert from 'node:assert/strict'
import test from 'node:test'
import { Mesh, MeshBasicMaterial, PerspectiveCamera, Raycaster, Vector3 } from 'three'
import { BODY, CAP_HEIGHT, KEYS } from '../src/features/experience/keyboard/layout.js'
import { createKeycap } from '../src/features/experience/keyboard/geometry.js'
import { HERO_SHOT, INTRO_SHOT, fitShot } from '../src/features/experience/scene/shots.js'

test('the 82-key layout has unique keys, physical clearance, and no overlapping caps', () => {
  assert.equal(KEYS.length, 82)
  assert.equal(new Set(KEYS.map((key) => key.id)).size, 82)
  for (const key of KEYS) {
    assert(Math.abs(key.x) + key.w / 2 < BODY.width / 2 - 0.15, key.id + ' fits inside the case')
    assert(Math.abs(key.z) + key.d / 2 < BODY.depth / 2 - 0.15, key.id + ' fits inside the case')
    for (const other of KEYS) {
      if (other.index <= key.index) continue
      const separated = Math.abs(key.x - other.x) >= (key.w + other.w) / 2 + 0.05 ||
        Math.abs(key.z - other.z) >= (key.d + other.d) / 2 + 0.05
      assert(separated, key.id + ' clears ' + other.id)
    }
  }
})

test('standard, function, modifier and spacebar caps have closed, upward-facing dished tops', () => {
  const material = new MeshBasicMaterial()
  for (const width of [0.885, 1.635, 2.135, 6.135]) {
    for (const depth of [0.505, 0.885]) {
      const geometry = createKeycap(width, depth, CAP_HEIGHT)
      const mesh = new Mesh(geometry, material)
      const center = new Raycaster(new Vector3(0, 2, 0), new Vector3(0, -1, 0)).intersectObject(mesh)
      const edge = new Raycaster(new Vector3(width * 0.28, 2, 0), new Vector3(0, -1, 0)).intersectObject(mesh)
      assert(center.length > 0, 'The cap center has a surface')
      assert(edge.length > 0)
      assert(center[0].point.y < edge[0].point.y, 'The center is dished below its surrounding face')
      assert(center[0].face.normal.y > 0.8, 'The upper surface faces the camera')
      for (const value of geometry.attributes.normal.array) assert(Number.isFinite(value))
      geometry.dispose()
    }
  }
  material.dispose()
})

test('camera fitting keeps the keyboard inside portrait, tablet and landscape frames', () => {
  for (const aspect of [0.5, 0.8, 1, 1.3, 1.8, 2.5]) {
    for (const shot of [HERO_SHOT, INTRO_SHOT]) {
      const frame = fitShot(shot, aspect)
      const camera = new PerspectiveCamera(shot.fov, aspect, 0.1, 100)
      camera.position.copy(frame.position)
      camera.up.set(0, 1, 0).applyAxisAngle(frame.position.clone().sub(frame.target).normalize(), shot.roll)
      camera.lookAt(frame.target)
      camera.updateMatrixWorld(true)
      for (const x of [-BODY.width / 2, BODY.width / 2]) {
        for (const y of [-0.4, 1]) {
          for (const z of [-BODY.depth / 2, BODY.depth / 2]) {
            const point = new Vector3(x, y, z).project(camera)
            assert(Math.abs(point.x) < 0.96 && Math.abs(point.y) < 0.96,
              'The product has frame clearance at aspect ' + aspect)
            assert(point.z < 1 && point.z > -1)
          }
        }
      }
    }
  }
})
