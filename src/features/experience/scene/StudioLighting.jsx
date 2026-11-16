import { Environment, Lightformer } from '@react-three/drei'
import { memo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'

function StudioLighting({ motionRef }) {
  const ground = useRef(null)
  const warmth = useRef(null)
  useFrame(() => {
    const pose = motionRef.current.pose
    ground.current.position.y = pose.bounds.minY - 0.3
    ground.current.visible = pose.spread < 0.99
    ground.current.material.opacity = 0.16 * (1 - pose.spread)
    warmth.current.intensity = 0.6 + pose.signature.flash * 0.16 + pose.signature.waveStrength * 0.1
  })
  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[-6, 12, 8]} intensity={3.3} color="#fff2e4" castShadow
        shadow-mapSize={[1024, 1024]} shadow-camera-left={-12} shadow-camera-right={12}
        shadow-camera-top={12} shadow-camera-bottom={-12} shadow-camera-near={1} shadow-camera-far={40}
        shadow-bias={-0.00015} shadow-normalBias={0.025} shadow-radius={3} />
      <directionalLight position={[2, 5, -10]} intensity={2.0} color="#c7d5ed" />
      <directionalLight ref={warmth} position={[10, 2, 4]} intensity={0.6} color="#f29b6d" />
      <Environment resolution={128} frames={1} environmentIntensity={0.8}>
        <Lightformer form="rect" intensity={3} color="#fff5eb" position={[-4, 8, 3]} rotation={[-Math.PI / 2, 0, 0]} scale={[12, 5, 1]} />
        <Lightformer form="rect" intensity={2.8} color="#d5e0f4" position={[2, 4, -8]} rotation={[Math.PI / 3, 0, 0]} scale={[14, 1.5, 1]} />
        <Lightformer form="rect" intensity={1.7} position={[-10, 3, 0]} rotation={[0, Math.PI / 2, 0]} scale={[2, 6, 1]} />
        <Lightformer form="rect" intensity={1.2} color="#f69969" position={[10, 2, 2]} rotation={[0, -Math.PI / 2, 0]} scale={[3, 4, 1]} />
      </Environment>
      <mesh ref={ground} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.7, 0]} receiveShadow>
        <planeGeometry args={[32, 24]} />
        <shadowMaterial transparent opacity={0.16} />
      </mesh>
    </>
  )
}

// Layer selection changes the DOM readout, not the studio environment.
export default memo(StudioLighting)
