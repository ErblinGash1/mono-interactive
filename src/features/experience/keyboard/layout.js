// Original 75% ANSI-inspired MONO layout. One unit is one key pitch.
export const PITCH = 1
export const KEY_GAP = 0.115
export const ROW_WIDTH = 16.25
export const BODY = { width: 17.15, depth: 6.68, height: 0.58 }
export const LAYERS = { base: 0, battery: -0.18, pcb: -0.065, foam: 0.16, plate: 0.295, switches: 0.37, caps: 0.51 }
export const CAP_HEIGHT = 0.34

const key = (id, width = 1, label = id, options = {}) => ({ id, width, label, ...options })
const letters = (text) => [...text].map((letter) => key(letter))
const gap = (width) => ({ gap: width })

const rows = [
  { depth: 0.62, keys: [
    key('esc', 1, 'esc', { accent: true }), gap(0.25),
    ...Array.from({ length: 4 }, (_, i) => key('F' + (i + 1))), gap(0.25),
    ...Array.from({ length: 4 }, (_, i) => key('F' + (i + 5))), gap(0.25),
    ...Array.from({ length: 4 }, (_, i) => key('F' + (i + 9))), gap(0.25),
    key('mode', 1, 'mono'),
  ] },
  { depth: 1, keys: [
    key('grave', 1, '`', { secondary: '~' }),
    ...[...'1234567890'].map((n, i) => key(n, 1, n, { secondary: '!@#$%^&*()'[i] })),
    key('minus', 1, '−', { secondary: '_' }), key('equals', 1, '=', { secondary: '+' }),
    key('backspace', 2, 'delete'), gap(0.25), key('delete', 1, 'del'),
  ] },
  { depth: 1, keys: [
    key('tab', 1.5, 'tab'), ...letters('QWERTYUIOP'),
    key('bracket-left', 1, '[', { secondary: '{' }), key('bracket-right', 1, ']', { secondary: '}' }),
    key('backslash', 1.5, '\\'), gap(0.25), key('home', 1, 'home'),
  ] },
  { depth: 1, keys: [
    key('caps-lock', 1.75, 'caps'), ...letters('ASDFGHJKL'),
    key('semicolon', 1, ';', { secondary: ':' }), key('quote', 1, "'", { secondary: '"' }),
    key('enter', 2.25, 'return', { accent: true }), gap(0.25), key('page-up', 1, 'pg up'),
  ] },
  { depth: 1, keys: [
    key('shift-left', 2.25, 'shift'), ...letters('ZXCVBNM'),
    key('comma', 1, ',', { secondary: '<' }), key('period', 1, '.', { secondary: '>' }),
    key('slash', 1, '/', { secondary: '?' }), key('shift-right', 1.75, 'shift'),
    gap(0.25), key('up', 1, '↑'), key('page-down', 1, 'pg dn'),
  ] },
  { depth: 1, keys: [
    key('control-left', 1.25, 'ctrl'), key('meta', 1.25, 'super'), key('alt-left', 1.25, 'alt'),
    key('space', 6.25, ''), key('alt-right', 1, 'alt'), key('fn', 1, 'fn'),
    key('control-right', 1, 'ctrl'), gap(0.25), key('left', 1, '←'), key('down', 1, '↓'), key('right', 1, '→'),
  ] },
]

const rowDepth = 5.84
export const KEYS = []
let z = -rowDepth / 2
for (const [rowIndex, row] of rows.entries()) {
  let x = -ROW_WIDTH / 2
  for (const definition of row.keys) {
    if (definition.gap) { x += definition.gap; continue }
    KEYS.push({
      ...definition, index: KEYS.length, row: rowIndex,
      x: x + definition.width / 2, z: z + row.depth / 2,
      w: definition.width - KEY_GAP, d: row.depth - KEY_GAP,
    })
    x += definition.width
  }
  z += row.depth + (rowIndex === 0 ? 0.22 : 0)
}

const groups = new Map()
for (const item of KEYS) {
  const size = item.w + ':' + item.d
  if (!groups.has(size)) groups.set(size, [])
  groups.get(size).push(item)
}
export const KEY_GROUPS = [...groups.values()]
export const ENCODER = { x: 7.62, z: -2.61 }
