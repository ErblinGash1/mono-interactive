import {
  AdditiveBlending, BoxGeometry, Color, CylinderGeometry, InstancedBufferAttribute,
  MeshBasicMaterial, MeshPhysicalMaterial, MeshStandardMaterial, PlaneGeometry,
} from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { BODY, CAP_HEIGHT, KEY_GROUPS, KEYS } from './layout.js'
import { createKeycap, createSlab } from './geometry.js'
import { createLegendAtlas, createLightPool, createSurfaceTexture } from './textures.js'
import { createInternalResources, SWITCH_OPENINGS } from './internals.js'

export function createKeyboardResources(anisotropy) {
  const atlas = createLegendAtlas(Math.min(anisotropy, 8))
  const surface = createSurfaceTexture()
  const lightPool = createLightPool()
  const internals = createInternalResources(surface)
  const stemParts = [new BoxGeometry(0.28, 0.12, 0.09), new BoxGeometry(0.09, 0.12, 0.28)]
  const stem = mergeGeometries(stemParts)
  stemParts.forEach(part => part.dispose())
  const geometries = {
    body: createSlab(BODY.width, BODY.depth, BODY.height, 0.22, 0.055,
      { width: 16.62, depth: 6.15, radius: 0.12 }),
    rim: createSlab(BODY.width - 0.035, BODY.depth - 0.035, 0.095, 0.19, 0.015,
      { width: 16.64, depth: 6.15, radius: 0.13 }),
    underside: createSlab(BODY.width - 0.3, BODY.depth - 0.3, 0.1, 0.19, 0.025),
    seam: createSlab(BODY.width + 0.012, BODY.depth + 0.012, 0.027, 0.23, 0.005),
    plate: createSlab(16.67, 6.18, 0.065, 0.12, 0, SWITCH_OPENINGS),
    housing: createSlab(0.76, 0.76, 0.12, 0.07, 0.01,
      { width: 0.46, depth: 0.46, radius: 0.06, segments: 2 }, 2),
    stem,
    screw: new CylinderGeometry(0.043, 0.043, 0.025, 12),
    foot: new CylinderGeometry(0.28, 0.28, 0.07, 20),
    pool: new PlaneGeometry(1, 1).rotateX(-Math.PI / 2),
    legends: new PlaneGeometry(1, 1, 6, 6).rotateX(-Math.PI / 2),
  }
  const positions = geometries.legends.attributes.position
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i) * 2
    const z = positions.getZ(i) * 2
    positions.setY(i, -0.025 * Math.max(0, 1 - x * x - z * z) + 0.004)
  }
  geometries.legends.computeVertexNormals()
  geometries.legends.setAttribute('legendRect', new InstancedBufferAttribute(new Float32Array(atlas.rects.flat()), 4))

  const materials = {
    case: new MeshStandardMaterial({ color: '#30343a', metalness: 0.84, roughness: 0.34, roughnessMap: surface, bumpMap: surface, bumpScale: 0.004 }),
    rim: new MeshStandardMaterial({ color: '#61676e', metalness: 0.91, roughness: 0.30 }),
    underside: new MeshStandardMaterial({ color: '#171a1e', metalness: 0.55, roughness: 0.5 }),
    seam: new MeshStandardMaterial({ color: '#080a0c', roughness: 0.9 }),
    plate: new MeshStandardMaterial({ color: '#16191d', metalness: 0.65, roughness: 0.46 }),
    cap: new MeshPhysicalMaterial({
      color: '#ffffff', metalness: 0, roughness: 0.65, roughnessMap: surface,
      bumpMap: surface, bumpScale: 0.006, sheen: 0.16, sheenRoughness: 0.8, sheenColor: new Color('#686868'),
    }),
    housing: new MeshStandardMaterial({ color: '#27252a', metalness: 0.1, roughness: 0.34 }),
    stem: new MeshStandardMaterial({ color: '#aa5a36', roughness: 0.48 }),
    rubber: new MeshStandardMaterial({ color: '#08090a', roughness: 1 }),
    screw: new MeshStandardMaterial({ color: '#727780', metalness: 0.95, roughness: 0.25 }),
    knob: new MeshStandardMaterial({ color: '#3b3f45', metalness: 0.9, roughness: 0.3 }),
    ember: new MeshStandardMaterial({ color: '#d96e41', emissive: '#dc632e', emissiveIntensity: 0.28, roughness: 0.4, metalness: 0.25 }),
    port: new MeshBasicMaterial({ color: '#030405' }),
    legend: new MeshStandardMaterial({
      color: '#ffffff', map: atlas.texture, alphaTest: 0.15,
      roughness: 0.7, emissive: '#b7b1a5', emissiveIntensity: 0.05,
      polygonOffset: true, polygonOffsetFactor: -1,
    }),
    pool: new MeshBasicMaterial({
      color: '#b86632', map: lightPool, transparent: true, opacity: 0.23,
      blending: AdditiveBlending, depthWrite: false, toneMapped: false,
    }),
  }
  Object.assign(geometries, internals.geometries)
  Object.assign(materials, internals.materials)
  // One small, isolated shader adaptation: all 82 legends share one draw call.
  materials.legend.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nattribute vec4 legendRect;')
      .replace('#include <uv_vertex>', '#include <uv_vertex>\nvMapUv = legendRect.xy + uv * legendRect.zw;')
  }
  materials.legend.customProgramCacheKey = () => 'mono-legend-atlas-v1'

  const batches = KEY_GROUPS.map((keys) => ({
    keys, geometry: createKeycap(keys[0].w, keys[0].d, CAP_HEIGHT),
    colors: keys.map((item) => new Color(item.accent ? '#df784c' : item.label.length > 1 ? '#20242a' : '#2b3037')),
  }))
  return {
    geometries, materials, batches, keyCount: KEYS.length,
    dispose() {
      Object.values(geometries).forEach((geometry) => geometry.dispose())
      Object.values(materials).forEach((material) => material.dispose())
      batches.forEach((batch) => batch.geometry.dispose())
      atlas.texture.dispose()
      surface.dispose()
      lightPool.dispose()
      internals.textures.forEach(texture => texture.dispose())
    },
  }
}
