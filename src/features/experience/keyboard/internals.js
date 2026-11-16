import {
  BoxGeometry, CatmullRomCurve3, Curve, CylinderGeometry, MeshStandardMaterial,
  RingGeometry, TubeGeometry, Vector3,
} from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { KEYS } from './layout.js'
import { createRoundedSurface, createSlab } from './geometry.js'
import { createBatteryTexture, createPCBTexture } from './textures.js'

export const STABILIZERS = KEYS.filter(key => key.width >= 2).map(key => ({
  x: key.x, z: key.z, half: key.width >= 6 ? 2.5 : 0.625,
}))
export const MOUNTS = [-1, 1].flatMap(x => [-1, 1].map(z => ({ x: x * 7.8, z: z * 2.75 })))
export const SWITCH_OPENINGS = [
  ...KEYS.map(key => ({ x: key.x, z: key.z, width: 0.70, depth: 0.70, radius: 0.025, segments: 1 })),
  ...STABILIZERS.flatMap(key => [-1, 1].map(side => ({
    x: key.x + side * key.half, z: key.z, width: 0.28, depth: 0.48, radius: 0.025, segments: 1,
  }))),
  { x: 7.62, z: -2.61, width: 0.76, depth: 0.76, radius: 0.30, segments: 3 },
]
const mountHoles = MOUNTS.map(point => ({ ...point, width: 0.18, depth: 0.18, radius: 0.085 }))

function mergeOwned(geometries) {
  const parts = geometries.map(geometry => geometry.index ? geometry.toNonIndexed() : geometry)
  const result = mergeGeometries(parts)
  for (const part of parts) part.dispose()
  for (const geometry of geometries) geometry.dispose()
  return result
}

class SpringPath extends Curve {
  getPoint(t, target = new Vector3()) {
    const angle = t * Math.PI * 10
    return target.set(Math.cos(angle) * 0.17, (t - 0.5) * 0.16, Math.sin(angle) * 0.17)
  }
}

export function createInternalResources(surface) {
  const pcbTexture = createPCBTexture()
  const batteryTexture = createBatteryTexture()
  const geometries = {
    foam: createSlab(16.50, 6.05, 0.18, 0.12, 0, SWITCH_OPENINGS),
    pcb: createSlab(16.42, 6.00, 0.065, 0.13, 0.006, mountHoles),
    pcbSurface: createRoundedSurface(16.40, 5.98, 0.12, mountHoles),
    lowerHousing: createSlab(0.66, 0.66, 0.17, 0.05, 0.008, null, 2),
    spring: new TubeGeometry(new SpringPath(), 40, 0.012, 3, false),
    pins: mergeOwned([-1, 1].map(side => new CylinderGeometry(0.015, 0.015, 0.35, 5).translate(side * 0.17, -0.25, side * 0.18))),
    pads: mergeOwned([-1, 1].map(side => new RingGeometry(0.022, 0.065, 10).rotateX(-Math.PI / 2).translate(side * 0.17, 0, side * 0.18))),
    diode: new BoxGeometry(0.16, 0.045, 0.075),
    led: new BoxGeometry(0.17, 0.035, 0.085),
    chip: createSlab(0.70, 0.48, 0.055, 0.025, 0.006),
    capacitor: new BoxGeometry(0.12, 0.05, 0.075),
    battery: createSlab(6.9, 4.4, 0.10, 0.10, 0.014),
    batteryLabel: createRoundedSurface(5.8, 2.4, 0.06),
    batteryTape: mergeOwned([-1, 1].map(side => new BoxGeometry(0.11, 0.105, 4.25).translate(side * 3.25, 0, 0))),
    connector: new BoxGeometry(0.28, 0.07, 0.17),
    redLead: new TubeGeometry(new CatmullRomCurve3([
      new Vector3(-0.45, 0.025, 1.8), new Vector3(-0.2, 0.055, 2.15), new Vector3(0.1, 0.08, 2.32),
    ]), 18, 0.018, 5, false),
    blackLead: new TubeGeometry(new CatmullRomCurve3([
      new Vector3(0.45, 0.025, 1.8), new Vector3(0.25, 0.055, 2.15), new Vector3(-0.1, 0.08, 2.32),
    ]), 18, 0.018, 5, false),
    standoffs: mergeOwned(MOUNTS.map(point =>
      new CylinderGeometry(0.09, 0.10, 0.16, 10).translate(point.x, -0.17, point.z))),
    stabilizers: mergeOwned(STABILIZERS.flatMap(key => [-1, 1].map(side =>
      new BoxGeometry(0.22, 0.18, 0.32).translate(key.x + side * key.half, 0.035, key.z)))),
    stabilizerWires: mergeOwned(STABILIZERS.flatMap(key => [
      new BoxGeometry(key.half * 2, 0.026, 0.026).translate(key.x, 0.08, key.z + 0.10),
      ...[-1, 1].map(side => new BoxGeometry(0.026, 0.026, 0.2).translate(key.x + side * key.half, 0.08, key.z)),
    ])),
  }
  const materials = {
    foam: new MeshStandardMaterial({ color: '#32302c', roughness: 1, bumpMap: surface, bumpScale: 0.028 }),
    pcb: new MeshStandardMaterial({ color: '#12352f', metalness: 0.18, roughness: 0.58 }),
    pcbSurface: new MeshStandardMaterial({ color: '#ffffff', map: pcbTexture, metalness: 0.30, roughness: 0.5 }),
    copper: new MeshStandardMaterial({ color: '#b8a374', metalness: 0.8, roughness: 0.4 }),
    spring: new MeshStandardMaterial({ color: '#9aa2ab', metalness: 0.95, roughness: 0.3 }),
    chip: new MeshStandardMaterial({ color: '#15191c', roughness: 0.6, metalness: 0.1 }),
    ceramic: new MeshStandardMaterial({ color: '#b4a18a', roughness: 0.6, metalness: 0.2 }),
    led: new MeshStandardMaterial({ color: '#e7d5b5', emissive: '#d69a5d', emissiveIntensity: 0.3, roughness: 0.5 }),
    battery: new MeshStandardMaterial({ color: '#8b9192', metalness: 0.75, roughness: 0.43, bumpMap: surface, bumpScale: 0.004 }),
    batteryLabel: new MeshStandardMaterial({ color: '#ffffff', map: batteryTexture, roughness: 0.9 }),
    tape: new MeshStandardMaterial({ color: '#a87539', metalness: 0.15, roughness: 0.7 }),
    redLead: new MeshStandardMaterial({ color: '#8c362a', roughness: 0.8 }),
  }
  return { geometries, materials, textures: [pcbTexture, batteryTexture] }
}
