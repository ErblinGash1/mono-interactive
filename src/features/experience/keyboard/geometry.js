import { BufferGeometry, ExtrudeGeometry, Float32BufferAttribute, Path, Shape, ShapeGeometry } from 'three'

export function roundedOutline(width, depth, radius, segments = 5) {
  const r = Math.min(radius, width / 2 - 0.001, depth / 2 - 0.001)
  const points = []
  for (let corner = 0; corner < 4; corner++) {
    const start = corner * Math.PI / 2
    const cx = (corner === 0 || corner === 3 ? 1 : -1) * (width / 2 - r)
    const cz = (corner < 2 ? 1 : -1) * (depth / 2 - r)
    for (let step = 0; step <= segments; step++) {
      const angle = start + step / segments * Math.PI / 2
      points.push([cx + Math.cos(angle) * r, cz + Math.sin(angle) * r])
    }
  }
  return points
}

function roundedPath(path, width, depth, radius, cx = 0, cz = 0, segments = 5) {
  const points = roundedOutline(width, depth, radius, segments)
  points.forEach(([x, z], index) => index === 0 ? path.moveTo(x + cx, z + cz) : path.lineTo(x + cx, z + cz))
  path.closePath()
  return path
}

export function createSlab(width, depth, height, radius, bevel = 0.025, hole = null, segments = 5) {
  const shape = roundedPath(new Shape(), width - bevel * 2, depth - bevel * 2, radius, 0, 0, segments)
  if (hole) {
    for (const opening of Array.isArray(hole) ? hole : [hole]) {
      shape.holes.push(roundedPath(new Path(), opening.width, opening.depth, opening.radius,
        opening.x ?? 0, -(opening.z ?? 0), opening.segments ?? 5))
    }
  }
  const thickness = height - bevel * 2
  const geometry = new ExtrudeGeometry(shape, {
    depth: thickness, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel,
    bevelSegments: 2, steps: 1, curveSegments: 4,
  })
  geometry.rotateX(-Math.PI / 2)
  geometry.translate(0, -thickness / 2, 0)
  geometry.computeVertexNormals()
  return geometry
}

export function createRoundedSurface(width, depth, radius, holes = []) {
  const shape = roundedPath(new Shape(), width, depth, radius)
  for (const opening of holes) {
    shape.holes.push(roundedPath(new Path(), opening.width, opening.depth, opening.radius, opening.x, -opening.z, 2))
  }
  const geometry = new ShapeGeometry(shape).rotateX(-Math.PI / 2)
  const position = geometry.attributes.position
  const uv = geometry.attributes.uv
  for (let i = 0; i < position.count; i++) uv.setXY(i, position.getX(i) / width + 0.5, 0.5 - position.getZ(i) / depth)
  return geometry
}

// Rounded rings preserve the corner radius on wide modifiers and the spacebar.
// The cap is a tapered shell with a softly dished upper face.
export function createKeycap(width, depth, height = 0.34) {
  const rings = []
  const addRing = (w, d, radius, y, dish = 0) => {
    const ring = roundedOutline(w, d, radius)
    rings.push(ring.map(([x, z]) => [x, y - dish * Math.max(0, 1 - (x / (width / 2)) ** 2 - (z / (depth / 2)) ** 2), z]))
  }
  addRing(width - 0.02, depth - 0.02, 0.075, 0)
  addRing(width, depth, 0.085, 0.035)
  addRing(width - 0.065, depth - 0.065, 0.095, height - 0.08)
  addRing(width - 0.11, depth - 0.11, 0.11, height - 0.025)
  addRing(width - 0.16, depth - 0.16, 0.09, height)
  const faceWidth = width - 0.16
  const faceDepth = depth - 0.16
  for (const scale of [0.75, 0.5, 0.25, 0.001]) {
    addRing(faceWidth * scale, faceDepth * scale, 0.09 * scale, height, 0.025)
  }
  const positions = []
  const uv = []
  const indices = []
  const count = rings[0].length
  rings.forEach((ring) => ring.forEach(([x, y, z]) => {
    positions.push(x, y, z)
    uv.push(x * 2, z * 2)
  }))
  for (let row = 0; row < rings.length - 1; row++) {
    for (let i = 0; i < count; i++) {
      const next = (i + 1) % count
      const a = row * count + i
      const b = row * count + next
      const c = (row + 1) * count + i
      const d = (row + 1) * count + next
      indices.push(a, c, b, b, c, d)
    }
  }
  const center = positions.length / 3
  positions.push(0, height - 0.025, 0)
  uv.push(0, 0)
  const lastRing = (rings.length - 1) * count
  for (let i = 0; i < count; i++) indices.push(lastRing + i, center, lastRing + (i + 1) % count)
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.setAttribute('uv', new Float32BufferAttribute(uv, 2))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
}
