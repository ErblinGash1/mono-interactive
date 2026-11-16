/* oxlint-disable react/immutability -- The assembly owns these disposable Three.js resources; useFrame updates GPU materials and instance buffers in place. */
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Color, DynamicDrawUsage, Matrix4, Object3D, Plane, Ray, Raycaster, Vector3 } from 'three'
import { BODY, CAP_HEIGHT, ENCODER, KEYS, LAYERS } from './layout.js'
import { createKeyboardResources } from './resources.js'
import { Batteries, Electronics, StaticInstances } from './InternalLayers.jsx'
import { LAYER_DEFS } from './layers.js'
import { keyWave, SIGNATURE_KEY } from '../scene/finale.js'

const lowerPositions = KEYS.map(key => [key.x, -0.04, key.z])
const springPositions = KEYS.map(key => [key.x, 0.055, key.z])
const pinPositions = KEYS.map(key => [key.x, 0, key.z])

function setInstance(mesh, index, helper, x, y, z, sx = 1, sy = 1, sz = 1) {
  helper.position.set(x, y, z)
  helper.scale.set(sx, sy, sz)
  helper.updateMatrix()
  mesh.setMatrixAt(index, helper.matrix)
}

function Encoder({ materials }) {
  const knurl = useRef(null)
  useLayoutEffect(() => {
    const helper = new Object3D()
    for (let i = 0; i < 40; i++) {
      const angle = i / 40 * Math.PI * 2
      helper.position.set(Math.sin(angle) * 0.397, 0, Math.cos(angle) * 0.397)
      helper.rotation.y = angle
      helper.updateMatrix()
      knurl.current.setMatrixAt(i, helper.matrix)
    }
    knurl.current.instanceMatrix.needsUpdate = true
  }, [])
  return (
    <group position={[ENCODER.x, 0.22, ENCODER.z]} name="Rotary encoder">
      <mesh material={materials.rim} position={[0, -0.14, 0]}><cylinderGeometry args={[0.45, 0.45, 0.05, 48]} /></mesh>
      <mesh castShadow material={materials.knob}><cylinderGeometry args={[0.4, 0.4, 0.28, 64]} /></mesh>
      <instancedMesh ref={knurl} args={[null, materials.knob, 40]}>
        <boxGeometry args={[0.016, 0.22, 0.018]} />
      </instancedMesh>
      <mesh material={materials.ember} position={[0, 0.145, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.36, 0.012, 6, 48]} />
      </mesh>
      <mesh material={materials.ember} position={[0, 0.145, -0.20]}><boxGeometry args={[0.025, 0.012, 0.13]} /></mesh>
    </group>
  )
}

function Assembly({ resources, pointer, reducedMotion, visible, motionRef }) {
  const root = useRef(null)
  const caps = useRef([])
  const legends = useRef(null)
  const housings = useRef(null)
  const stems = useRef(null)
  const pools = useRef(null)
  const layerRefs = useRef([])
  const switchDetails = useRef(null)
  const returnSprings = useRef(null)
  const signaturePrevious = useRef({ cap: -1, stem: -1, housing: -1, spring: -1, springScale: -1, press: -1, wave: -2, waveStrength: -1, flash: -1 })
  const springsRef = useRef({
    lift: new Float32Array(KEYS.length), velocity: new Float32Array(KEYS.length),
    x: 0, y: 0, vx: 0, vy: 0, running: false, weight: 1,
  })
  const scratchRef = useRef({
    object: new Object3D(), caster: new Raycaster(), inverse: new Matrix4(), ray: new Ray(), hit: new Vector3(),
    color: new Color(), ember: new Color('#ed8b58'),
    tops: new Plane(new Vector3(0, 1, 0), -(LAYERS.caps + CAP_HEIGHT)),
  })

  const writeCaps = useCallback(() => {
    const springs = springsRef.current
    const scratch = scratchRef.current
    const signature = motionRef.current.pose.signature
    resources.batches.forEach((batch, batchIndex) => {
      const mesh = caps.current[batchIndex]
      batch.keys.forEach((item, slot) => {
        const travel = item.index === SIGNATURE_KEY.index ? signature.cap - signature.press : 0
        setInstance(mesh, slot, scratch.object, item.x, springs.lift[item.index] * motionRef.current.pose.interaction + travel, item.z)
      })
      mesh.instanceMatrix.needsUpdate = true
    })
    KEYS.forEach((item) => {
      setInstance(legends.current, item.index, scratch.object,
        item.x, springs.lift[item.index] * motionRef.current.pose.interaction + (item.index === SIGNATURE_KEY.index ? signature.cap - signature.press : 0), item.z, item.w - 0.17, 1, item.d - 0.17)
    })
    legends.current.instanceMatrix.needsUpdate = true
  }, [motionRef, resources])

  useLayoutEffect(() => {
    const scratch = scratchRef.current
    const shared = motionRef.current
    shared.layers = layerRefs.current
    resources.batches.forEach((batch, index) => {
      caps.current[index].instanceMatrix.setUsage(DynamicDrawUsage)
      batch.colors.forEach((color, slot) => caps.current[index].setColorAt(slot, color))
      caps.current[index].instanceColor.needsUpdate = true
    })
    legends.current.instanceMatrix.setUsage(DynamicDrawUsage)
    KEYS.forEach((item) => {
      setInstance(housings.current, item.index, scratch.object, item.x, 0.02, item.z)
      setInstance(stems.current, item.index, scratch.object, item.x, 0.105, item.z)
      setInstance(pools.current, item.index, scratch.object, item.x, 0, item.z, item.w + 0.22, 1, item.d + 0.22)
      pools.current.setColorAt(item.index, scratch.color.setScalar(1))
    })
    for (const mesh of [housings.current, stems.current, pools.current]) mesh.instanceMatrix.needsUpdate = true
    pools.current.instanceColor.needsUpdate = true
    writeCaps()
    // Instance buffers are updated in place. Resources own their shared GPU assets.
    return () => { shared.layers = [] }
  }, [motionRef, resources, writeCaps])

  useFrame(({ camera, invalidate }, frameDelta) => {
    if (!visible) return
    const springs = springsRef.current
    const scratch = scratchRef.current
    const pose = motionRef.current.pose
    const signature = pose.signature
    const previous = signaturePrevious.current
    const signatureMoved = signature.cap !== previous.cap || signature.press !== previous.press
    if (signature.stem !== previous.stem || signature.press !== previous.press) {
      setInstance(stems.current, SIGNATURE_KEY.index, scratch.object, SIGNATURE_KEY.x, 0.105 + signature.stem - signature.press, SIGNATURE_KEY.z)
      stems.current.instanceMatrix.needsUpdate = true
    }
    if (signature.housing !== previous.housing) {
      setInstance(housings.current, SIGNATURE_KEY.index, scratch.object, SIGNATURE_KEY.x, 0.02 + signature.housing, SIGNATURE_KEY.z)
      housings.current.instanceMatrix.needsUpdate = true
    }
    if (signature.spring !== previous.spring || signature.springScale !== previous.springScale) {
      setInstance(returnSprings.current, SIGNATURE_KEY.index, scratch.object, SIGNATURE_KEY.x,
        0.055 + signature.spring - signature.press * 0.2, SIGNATURE_KEY.z, 1, signature.springScale, 1)
      returnSprings.current.instanceMatrix.needsUpdate = true
    }
    if (signature.wave !== previous.wave || signature.waveStrength !== previous.waveStrength || signature.flash !== previous.flash) {
      resources.batches.forEach((batch, batchIndex) => {
        const mesh = caps.current[batchIndex]
        batch.keys.forEach((item, slot) => {
          const light = keyWave(item, signature)
          scratch.color.copy(batch.colors[slot]).lerp(scratch.ember, light * 0.22 + (item.index === SIGNATURE_KEY.index ? signature.flash * 0.14 : 0))
          mesh.setColorAt(slot, scratch.color)
        })
        mesh.instanceColor.needsUpdate = true
      })
      for (const item of KEYS) {
        const light = keyWave(item, signature)
        scratch.color.setScalar(1 + light * 2 + (item.index === SIGNATURE_KEY.index ? signature.flash : 0))
        pools.current.setColorAt(item.index, scratch.color)
      }
      pools.current.instanceColor.needsUpdate = true
      resources.materials.pool.opacity = 0.23 + signature.waveStrength * 0.28 + signature.flash * 0.15
      resources.materials.ember.emissiveIntensity = 0.28 + signature.flash * 0.18
    }
    previous.cap = signature.cap
    previous.stem = signature.stem
    previous.housing = signature.housing
    previous.spring = signature.spring
    previous.springScale = signature.springScale
    previous.press = signature.press
    previous.wave = signature.wave
    previous.waveStrength = signature.waveStrength
    previous.flash = signature.flash
    for (let i = 0; i < 7; i++) {
      const id = LAYER_DEFS[i].id
      layerRefs.current[i].position.y = LAYERS[id] + pose.offsets[i]
      if (i >= 3 && i <= 5) layerRefs.current[i].visible = pose.spread > 0.00001
    }
    // Advance springs in small substeps on slow frames; never integrate an
    // entire idle/background interval when demand rendering wakes up.
    const elapsed = springs.running ? Math.min(frameDelta, 0.1) : 1 / 60
    const steps = Math.max(1, Math.ceil(elapsed * 60))
    const dt = elapsed / steps
    const active = pointer.current.active && !pointer.current.dragging && !reducedMotion && pose.interaction > 0
    switchDetails.current.visible = pose.spread > 0.00001 || signature.cap > 0 || active || springs.running
    const targetX = active ? pointer.current.x : 0
    const targetY = active ? pointer.current.y : 0
    if (reducedMotion || pose.interaction === 0) {
      springs.x = springs.y = springs.vx = springs.vy = 0
    } else {
      for (let step = 0; step < steps; step++) {
        springs.vx += ((targetX - springs.x) * 38 - springs.vx * 9) * dt
        springs.vy += ((targetY - springs.y) * 38 - springs.vy * 9) * dt
        springs.x += springs.vx * dt
        springs.y += springs.vy * dt
      }
    }
    root.current.rotation.set(springs.y * 0.035 * pose.interaction, springs.x * 0.045 * pose.interaction, 0)
    let hx = Infinity
    let hz = Infinity
    if (active) {
      root.current.updateWorldMatrix(true, false)
      scratch.caster.setFromCamera({ x: pointer.current.x, y: -pointer.current.y }, camera)
      scratch.inverse.copy(root.current.matrixWorld).invert()
      scratch.ray.copy(scratch.caster.ray).applyMatrix4(scratch.inverse)
      if (scratch.ray.intersectPlane(scratch.tops, scratch.hit)) {
        hx = scratch.hit.x
        hz = scratch.hit.z
      }
    }
    let unsettled = Math.abs(springs.vx) + Math.abs(springs.vy) > 0.001 ||
      Math.abs(targetX - springs.x) + Math.abs(targetY - springs.y) > 0.001
    let changed = pose.interaction !== springs.weight || signatureMoved
    for (const item of KEYS) {
      const dx = Math.max(0, Math.abs(hx - item.x) - item.w / 2)
      const dz = Math.max(0, Math.abs(hz - item.z) - item.d / 2)
      const distance = Math.hypot(dx, dz)
      const target = active ? 0.105 * Math.max(0, 1 - distance / 0.7) ** 2 : 0
      const i = item.index
      const before = springs.lift[i]
      if (reducedMotion || pose.interaction === 0) {
        springs.lift[i] = springs.velocity[i] = 0
      } else {
        for (let step = 0; step < steps; step++) {
          springs.velocity[i] += ((target - springs.lift[i]) * 180 - springs.velocity[i] * 22) * dt
          springs.lift[i] += springs.velocity[i] * dt
        }
      }
      if (Math.abs(before - springs.lift[i]) > 0.0000001) changed = true
      if (Math.abs(target - springs.lift[i]) > 0.0001 || Math.abs(springs.velocity[i]) > 0.0005) unsettled = true
    }
    if (changed) writeCaps()
    springs.weight = pose.interaction
    springs.running = unsettled && !reducedMotion && pose.interaction > 0
    if (springs.running) invalidate()
  }, -0.4)

  const { geometries: geo, materials: mat } = resources
  return (
    <group ref={root} name="MONO M-01 keyboard">
      <group ref={element => { layerRefs.current[6] = element }} name="Case" position={[0, LAYERS.base, 0]}>
        <mesh geometry={geo.body} material={mat.case} castShadow receiveShadow />
        <mesh geometry={geo.underside} material={mat.underside} position={[0, -0.30, 0]} castShadow />
        <mesh geometry={geo.seam} material={mat.seam} position={[0, -0.14, 0]} />
        <mesh geometry={geo.rim} material={mat.rim} position={[0, 0.27, 0]} castShadow />
        <mesh geometry={geo.standoffs} material={mat.case} />
        {[-1, 1].flatMap((sx) => [-1, 1].map((sz) => (
          <group key={sx + ':' + sz} position={[sx * 8.30, 0, sz * 3.08]}>
            <mesh geometry={geo.screw} material={mat.screw} position={[0, 0.324, 0]} />
            <mesh material={mat.port} position={[0, 0.338, 0]}><boxGeometry args={[0.045, 0.002, 0.009]} /></mesh>
            <mesh geometry={geo.foot} material={mat.rubber} position={[-sx * 0.4, -0.39, -sz * 0.35]} />
          </group>
        )))}
        <group name="USB-C recess" position={[-6.7, -0.015, -BODY.depth / 2 - 0.004]}>
          <mesh material={mat.port}><boxGeometry args={[0.5, 0.18, 0.015]} /></mesh>
          <mesh material={mat.rim} position={[0, -0.01, -0.013]}><boxGeometry args={[0.29, 0.035, 0.025]} /></mesh>
        </group>
      </group>
      <group ref={element => { layerRefs.current[2] = element }} name="Plate" position={[0, LAYERS.plate, 0]}>
        <mesh geometry={geo.plate} material={mat.plate} receiveShadow castShadow />
        <instancedMesh name="Under-key light pools" ref={pools} position={[0, 0.038, 0]}
          args={[geo.pool, mat.pool, KEYS.length]} frustumCulled={false} />
      </group>
      <group ref={element => { layerRefs.current[3] = element }} name="Foam" position={[0, LAYERS.foam, 0]}>
        <mesh geometry={geo.foam} material={mat.foam} receiveShadow />
      </group>
      <group ref={element => { layerRefs.current[4] = element }} name="PCB" position={[0, LAYERS.pcb, 0]}>
        <Electronics resources={resources} />
      </group>
      <group ref={element => { layerRefs.current[5] = element }} name="Battery" position={[0, LAYERS.battery, 0]}>
        <Batteries resources={resources} />
      </group>
      <group ref={element => { layerRefs.current[1] = element }} name="Switches" position={[0, LAYERS.switches, 0]}>
        <instancedMesh ref={housings} args={[geo.housing, mat.housing, KEYS.length]} receiveShadow frustumCulled={false} />
        <instancedMesh ref={stems} args={[geo.stem, mat.stem, KEYS.length]} frustumCulled={false} />
        <group ref={switchDetails}>
          <StaticInstances name="Lower switch housings" geometry={geo.lowerHousing} material={mat.housing} positions={lowerPositions} />
          <StaticInstances name="Return springs" meshRef={returnSprings} geometry={geo.spring} material={mat.spring} positions={springPositions} />
          <StaticInstances name="Switch contact pins" geometry={geo.pins} material={mat.copper} positions={pinPositions} />
          <mesh geometry={geo.stabilizers} material={mat.housing} />
          <mesh geometry={geo.stabilizerWires} material={mat.spring} />
        </group>
        <Encoder materials={mat} />
      </group>
      <group ref={element => { layerRefs.current[0] = element }} name="Keycaps" position={[0, LAYERS.caps, 0]}>
        {resources.batches.map((batch, index) => (
          <instancedMesh key={index} ref={(element) => { caps.current[index] = element }}
            args={[batch.geometry, mat.cap, batch.keys.length]} castShadow receiveShadow frustumCulled={false} />
        ))}
        <instancedMesh name="Legends" ref={legends} position={[0, CAP_HEIGHT, 0]}
        args={[geo.legends, mat.legend, KEYS.length]} frustumCulled={false} />
      </group>
    </group>
  )
}

export default function KeyboardModel({ pointer, reducedMotion, visible, onReady, motionRef }) {
  const gl = useThree((state) => state.gl)
  const [resources, setResources] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    let owned
    // Effect ownership handles Strict Mode and lazy-load cancellation without
    // allocating a second renderer or leaving uploaded textures behind.
    document.fonts.load('500 24px "Space Grotesk Variable"').then(() => {
      if (!active) return
      owned = createKeyboardResources(gl.capabilities.getMaxAnisotropy())
      setResources(owned)
      onReady(true)
    }).catch((reason) => { if (active) setError(reason) })
    return () => { active = false; owned?.dispose() }
  }, [gl, onReady])

  if (error) throw error
  return resources ? <Assembly resources={resources} pointer={pointer} reducedMotion={reducedMotion} visible={visible} motionRef={motionRef} /> : null
}
