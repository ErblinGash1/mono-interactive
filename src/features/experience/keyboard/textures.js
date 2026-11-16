import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three'
import { KEYS } from './layout.js'

function canvas(width, height) {
  const element = document.createElement('canvas')
  element.width = width
  element.height = height
  const context = element.getContext('2d')
  if (!context) throw new Error('Canvas textures are unavailable')
  return { element, context }
}

// Local glyph atlas: no downloaded artwork, remote fonts, or per-key textures.
export function createLegendAtlas(anisotropy = 4) {
  const { element, context } = canvas(2048, 1024)
  const rects = []
  const pixels = 112
  let x = 4
  let y = 4
  let shelf = 0
  for (const item of KEYS) {
    const width = Math.ceil((item.w - 0.17) * pixels)
    const height = Math.ceil((item.d - 0.17) * pixels)
    if (x + width + 4 > element.width) { x = 4; y += shelf + 8; shelf = 0 }
    if (y + height > element.height) throw new Error('MONO legend atlas is full')
    rects.push([x / element.width, 1 - (y + height) / element.height, width / element.width, height / element.height])
    context.fillStyle = item.accent ? '#211b18' : '#dfddd6'
    context.textBaseline = 'middle'
    const small = item.label.length > 1
    const fontSize = (small ? 0.135 : 0.24) * pixels
    context.font = '500 ' + fontSize + 'px "Space Grotesk Variable", Arial, sans-serif'
    if (item.row === 0 || ['←', '→', '↑', '↓'].includes(item.label)) {
      context.textAlign = 'center'
      context.fillText(item.label, x + width / 2, y + height / 2)
    } else {
      context.textAlign = 'left'
      context.fillText(item.label, x + 0.09 * pixels, y + (small ? height * 0.64 : height * 0.48))
      if (item.secondary) {
        context.font = '400 ' + 0.105 * pixels + 'px "Space Grotesk Variable", Arial, sans-serif'
        context.globalAlpha = 0.65
        context.textAlign = 'right'
        context.fillText(item.secondary, x + width - 0.06 * pixels, y + height * 0.25)
        context.globalAlpha = 1
      }
    }
    x += width + 8
    shelf = Math.max(shelf, height)
  }
  const texture = new CanvasTexture(element)
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = anisotropy
  return { texture, rects }
}

export function createSurfaceTexture() {
  const { element, context } = canvas(256, 256)
  const image = context.createImageData(256, 256)
  let seed = 8241
  for (let index = 0; index < image.data.length; index += 4) {
    seed = (1664525 * seed + 1013904223) >>> 0
    const value = 205 + ((seed >>> 24) / 255) * 45
    image.data[index] = value
    image.data[index + 1] = value
    image.data[index + 2] = value
    image.data[index + 3] = 255
  }
  context.putImageData(image, 0, 0)
  const texture = new CanvasTexture(element)
  texture.wrapS = texture.wrapT = RepeatWrapping
  return texture // Data texture: deliberately uses linear / NoColorSpace.
}

export function createLightPool() {
  const { element, context } = canvas(64, 64)
  const gradient = context.createRadialGradient(32, 32, 5, 32, 32, 32)
  gradient.addColorStop(0, '#ffffff')
  gradient.addColorStop(0.45, '#ffffff75')
  gradient.addColorStop(1, '#ffffff00')
  context.fillStyle = gradient
  context.fillRect(0, 0, 64, 64)
  return new CanvasTexture(element)
}

export function createPCBTexture() {
  const { element, context } = canvas(1024, 512)
  context.fillStyle = '#123a32'
  context.fillRect(0, 0, 1024, 512)
  const px = x => (x / 16.4 + 0.5) * 1024
  const pz = z => (z / 6 + 0.5) * 512
  context.lineWidth = 1.2
  for (const item of KEYS) {
    const x = px(item.x)
    const y = pz(item.z)
    context.strokeStyle = '#739477'
    context.beginPath()
    context.moveTo(x - 9, y - 15)
    context.lineTo(x - 9, y - 24)
    context.lineTo(x + 15, y - 32)
    context.lineTo(x + 32, y - 32)
    context.stroke()
    context.strokeStyle = '#4c7964'
    context.beginPath()
    context.moveTo(x + 9, y + 15)
    context.lineTo(x + 22, y + 25)
    context.lineTo(x + 22, y + 33)
    context.stroke()
    for (const side of [-1, 1]) {
      context.strokeStyle = '#c1a976'
      context.beginPath()
      context.arc(x + side * 10.6, y + side * 15.4, 3.4, 0, Math.PI * 2)
      context.stroke()
    }
    context.strokeStyle = '#b4c4a670'
    context.strokeRect(x - 24, y - 29, 48, 55)
    context.font = '7px Arial, sans-serif'
    context.fillStyle = '#b3c6a5'
    context.fillText('SW' + String(item.index + 1).padStart(2, '0'), x - 22, y + 27)
  }
  context.fillStyle = '#d1d5b9'
  context.font = '500 14px "Space Grotesk Variable", Arial, sans-serif'
  context.fillText('MONO  /  M—01', 30, 491)
  context.font = '9px Arial, sans-serif'
  context.fillText('CONTROL BOARD  ·  CONCEPT REV. 03', 724, 491)
  const texture = new CanvasTexture(element)
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = 4
  return texture
}

export function createBatteryTexture() {
  const { element, context } = canvas(512, 256)
  context.fillStyle = '#202426'
  context.fillRect(0, 0, 512, 256)
  context.fillStyle = '#e4e0d6'
  context.font = '500 34px "Space Grotesk Variable", Arial, sans-serif'
  context.fillText('mono', 32, 65)
  context.fillStyle = '#a9aca9'
  context.font = '14px Arial, sans-serif'
  context.fillText('M—01  /  ENERGY MODULE', 32, 116)
  context.fillText('ILLUSTRATIVE POUCH CELL', 32, 146)
  context.fillStyle = '#c9814e'
  context.fillRect(32, 197, 116, 3)
  for (let i = 0; i < 42; i++) context.fillRect(292 + i * 3, 184, i % 3 === 0 ? 2 : 1, 30)
  const texture = new CanvasTexture(element)
  texture.colorSpace = SRGBColorSpace
  return texture
}
