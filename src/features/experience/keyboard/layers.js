import { BODY, CAP_HEIGHT } from './layout.js'

// Ordered from the key surface down to the enclosure. Offsets are additive;
// every layer uses the same spread factor, preserving order throughout.
export const LAYER_DEFS = [
  { id: 'caps', name: 'Keycaps', label: 'Sculpted keycaps', short: 'Keycaps', offset: 5.8, anchorY: CAP_HEIGHT / 2, min: 0, max: CAP_HEIGHT,
    description: 'Tapered, dished caps with a satin surface. Every legend belongs to one shared atlas; wide keys retain the same corner profile.' },
  { id: 'switches', name: 'Switches', label: 'Mechanical switches', short: 'Switches', offset: 4.2, anchorY: 0.05, min: -0.425, max: 0.38,
    description: 'Open polycarbonate housings reveal the return springs, cross stems, contact pins, and stabilizers beneath the longer keys.' },
  { id: 'plate', name: 'Plate', label: 'Aluminium plate', short: 'Plate', offset: 2.7, anchorY: 0, min: -0.0325, max: 0.0325,
    description: 'A perforated aluminium mounting plate aligns the switches. Separate cutouts make room for the stabilizer housings and rotary encoder.' },
  { id: 'foam', name: 'Foam', label: 'Acoustic foam', short: 'Foam', offset: 1.2, anchorY: 0, min: -0.09, max: 0.09,
    description: 'A porous dampening sheet sits between the plate and electronics, following the switch grid without filling the mechanical clearances.' },
  { id: 'pcb', name: 'PCB', label: 'PCB & electronics', short: 'PCB', offset: -0.25, anchorY: 0.04, min: -0.0325, max: 0.10,
    description: 'Copper routes, plated contacts, per-key LEDs, diodes, and controller packages make the signal path visible. An original illustrative circuit layout.' },
  { id: 'battery', name: 'Battery', label: 'Battery modules', short: 'Battery', offset: -1.7, anchorY: 0, min: -0.05, max: 0.13,
    description: 'Two foil-wrapped pouch cells sit low in the enclosure, with insulating tabs, paired power leads, and a compact connector.' },
  { id: 'base', name: 'Case', label: 'Lower enclosure', short: 'Enclosure', offset: -3.6, anchorY: -0.27, min: -0.425, max: 0.34,
    description: 'The graphite aluminium enclosure is a hollow tray, with a lower floor, mounting bosses, machined rim, recessed port, and rubber feet.' },
]
export const LAYER_COUNT = LAYER_DEFS.length
export const ASSEMBLED_BOUNDS = { width: BODY.width, depth: BODY.depth, minY: -0.425, maxY: 1 }
