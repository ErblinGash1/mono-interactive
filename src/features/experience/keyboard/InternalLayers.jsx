import { useLayoutEffect, useRef } from 'react'
import { Object3D } from 'three'
import { KEYS } from './layout.js'

export function StaticInstances({ name, geometry, material, positions, meshRef }) {
  const mesh = useRef(null)
  useLayoutEffect(() => {
    const helper = new Object3D()
    positions.forEach((position, index) => {
      helper.position.set(...position)
      helper.updateMatrix()
      mesh.current.setMatrixAt(index, helper.matrix)
    })
    mesh.current.instanceMatrix.needsUpdate = true
    mesh.current.computeBoundingSphere()
  }, [positions])
  return <instancedMesh ref={element => { mesh.current = element; if (meshRef) meshRef.current = element }}
    name={name} args={[geometry, material, positions.length]} frustumCulled={!meshRef} />
}

const diodePositions = KEYS.map(key => [key.x + 0.36, 0.058, key.z + 0.12])
const ledPositions = KEYS.map(key => [key.x, 0.052, key.z - 0.25])
const padPositions = KEYS.map(key => [key.x, 0.035, key.z])
const chipPositions = [[-5.5, 0.06, 2.65], [-2, 0.06, 2.65], [1.4, 0.06, 2.65], [5.1, 0.06, 2.65]]
const capacitorPositions = Array.from({ length: 20 }, (_, index) => [-5.5 + index * 0.57, 0.057, 2.93])
const batteryPositions = [[-3.8, 0, 0.1], [3.8, 0, 0.1]]
const labelPositions = batteryPositions.map(([x, y, z]) => [x, y + 0.052, z])
const connectorPositions = [[0, 0.09, 2.35]]

export function Electronics({ resources }) {
  const { geometries: geo, materials: mat } = resources
  return (
    <>
      <mesh geometry={geo.pcb} material={mat.pcb} receiveShadow />
      <mesh geometry={geo.pcbSurface} material={mat.pcbSurface} position={[0, 0.0335, 0]} />
      <StaticInstances name="Plated contacts" geometry={geo.pads} material={mat.copper} positions={padPositions} />
      <StaticInstances name="Per-key diodes" geometry={geo.diode} material={mat.chip} positions={diodePositions} />
      <StaticInstances name="Per-key LEDs" geometry={geo.led} material={mat.led} positions={ledPositions} />
      <StaticInstances name="Controller packages" geometry={geo.chip} material={mat.chip} positions={chipPositions} />
      <StaticInstances name="Ceramic capacitors" geometry={geo.capacitor} material={mat.ceramic} positions={capacitorPositions} />
    </>
  )
}

export function Batteries({ resources }) {
  const { geometries: geo, materials: mat } = resources
  return (
    <>
      <StaticInstances name="Pouch cells" geometry={geo.battery} material={mat.battery} positions={batteryPositions} />
      <StaticInstances name="Cell labels" geometry={geo.batteryLabel} material={mat.batteryLabel} positions={labelPositions} />
      <StaticInstances name="Insulating tape" geometry={geo.batteryTape} material={mat.tape} positions={batteryPositions} />
      <StaticInstances name="Power connector" geometry={geo.connector} material={mat.rubber} positions={connectorPositions} />
      <mesh geometry={geo.redLead} material={mat.redLead} />
      <mesh geometry={geo.blackLead} material={mat.rubber} />
    </>
  )
}
