import { MathUtils, Matrix4, Quaternion, Vector3 } from 'three'
import { ASSEMBLED_BOUNDS } from '../keyboard/layers.js'

export { HERO_SHOT, INTRO_SHOT } from './presets.js'
export const LOOK_AT = new Vector3(0, 0.18, 0)

export function createShotFrame() {
  return {
    position: new Vector3(), target: new Vector3(), up: new Vector3(), quaternion: new Quaternion(),
    direction: new Vector3(), right: new Vector3(), point: new Vector3(), matrix: new Matrix4(),
  }
}

export function fitShot(shot, aspect, bounds = ASSEMBLED_BOUNDS, out = createShotFrame()) {
  const { direction, right, up, point } = out
  direction.set(Math.sin(shot.azimuth) * Math.cos(shot.elevation), Math.sin(shot.elevation),
    Math.cos(shot.azimuth) * Math.cos(shot.elevation))
  right.set(0, 1, 0).cross(direction).normalize().applyAxisAngle(direction, shot.roll)
  up.crossVectors(direction, right)
  out.target.set(shot.targetX ?? 0, shot.targetY ?? 0.18, shot.targetZ ?? 0)
  const tanV = Math.tan(MathUtils.degToRad(shot.fov) / 2)
  const tanH = tanV * Math.max(0.1, aspect)
  let distance = 0
  for (let ix = -1; ix <= 1; ix += 2) {
    for (let iy = 0; iy < 2; iy++) {
      for (let iz = -1; iz <= 1; iz += 2) {
        point.set((bounds.centerX ?? 0) + ix * bounds.width / 2, iy === 0 ? bounds.minY : bounds.maxY,
          (bounds.centerZ ?? 0) + iz * bounds.depth / 2).sub(out.target)
        const nearSide = point.dot(direction)
        distance = Math.max(distance, Math.abs(point.dot(right)) / tanH + nearSide, Math.abs(point.dot(up)) / tanV + nearSide)
      }
    }
  }
  out.position.copy(direction).multiplyScalar(distance * 1.10 * shot.pullback).add(out.target)
  out.matrix.lookAt(out.position, out.target, up)
  out.quaternion.setFromRotationMatrix(out.matrix)
  return out
}

export function captureOrbitShot(camera, target, out, scratch) {
  scratch.position.copy(camera.position).sub(target)
  const distance = scratch.position.length()
  scratch.direction.copy(scratch.position).normalize()
  scratch.right.set(0, 1, 0).cross(scratch.direction).normalize()
  scratch.up.crossVectors(scratch.direction, scratch.right)
  scratch.point.set(1, 0, 0).applyQuaternion(camera.quaternion)
  out.azimuth = Math.atan2(scratch.direction.x, scratch.direction.z)
  out.elevation = Math.asin(scratch.direction.y)
  out.roll = Math.atan2(scratch.point.dot(scratch.up), scratch.point.dot(scratch.right))
  out.fov = camera.fov
  out.targetY = target.y
  out.targetX = target.x
  out.targetZ = target.z
  out.pullback = 1
  fitShot(out, camera.aspect, ASSEMBLED_BOUNDS, scratch)
  out.pullback = distance / scratch.position.distanceTo(scratch.target)
  return out
}
