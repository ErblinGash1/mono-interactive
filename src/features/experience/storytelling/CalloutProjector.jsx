import { useLayoutEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Vector3 } from 'three'
import { LAYER_DEFS } from '../keyboard/layers.js'

const anchorX = [-7.9, -7.86, -8.28, -8.18, -8.13, -7.20, -8.4]
const anchorZ = [2.42, 2.42, 2.65, 2.65, 2.65, 1.8, 2.65]

export default function CalloutProjector({ motionRef, elementsRef }) {
  const scratch = useRef({ point: new Vector3(), x: new Float64Array(7), y: new Float64Array(7), labels: new Float64Array(7) })
  useLayoutEffect(() => () => {
    if (motionRef.current.callouts) motionRef.current.callouts.dataset.projected = 'false'
  }, [motionRef])

  useFrame(({ camera, size }) => {
    const { pose, layers, metrics, callouts } = motionRef.current
    if (!callouts || !metrics?.labelGutter || pose.labels < 0.01 || layers.length !== 7) return
    const data = scratch.current
    const gap = Math.min(58, (size.height - 56) / 6)
    for (let i = 0; i < 7; i++) {
      if (!layers[i]) return
      data.point.set(anchorX[i], LAYER_DEFS[i].anchorY, anchorZ[i])
      layers[i].localToWorld(data.point).project(camera)
      data.x[i] = metrics.labelGutter + (data.point.x + 1) * size.width / 2
      data.y[i] = (1 - data.point.y) * size.height / 2
      data.labels[i] = Math.max(28, data.y[i], i === 0 ? 28 : data.labels[i - 1] + gap)
    }
    const overflow = Math.max(0, data.labels[6] - (size.height - 28))
    for (let i = 0; i < 7; i++) {
      const y = data.labels[i] - overflow
      const x = data.x[i]
      const ay = data.y[i]
      const elbow = Math.max(157, Math.min(x - 16, metrics.labelGutter + 24))
      elementsRef.current.buttons[i].style.transform = 'translateY(' + (y - 22) + 'px)'
      elementsRef.current.paths[i].setAttribute('d', 'M148,' + y + 'H' + elbow + 'L' + (x - 10) + ',' + ay + 'H' + x)
      elementsRef.current.dots[i].setAttribute('cx', x)
      elementsRef.current.dots[i].setAttribute('cy', ay)
    }
    callouts.dataset.projected = 'true'
  })
  return null
}
