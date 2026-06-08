// Game configuration + zone definitions.
// The ring is a circle; each zone occupies an arc measured in radians.
// `start` is the arc's starting angle (radians, 0 = 3 o'clock, clockwise+),
// `size` is the arc length in radians.

export const CANVAS_SIZE = 420        // px, square canvas
export const RING_RADIUS = 150        // px, radius of the track the marker rides
export const RING_WIDTH = 26          // px, thickness of the colored ring

export const BASE_SPEED = 2.2         // radians/second the marker travels at score 0
export const SPEED_PER_POINT = 0.12   // added to speed for each point scored
export const MAX_SPEED = 9            // hard cap on marker speed
export const FLASH_MS = 220           // hit/miss flash duration in ms
export const START_LIVES = 3

const TAU = Math.PI * 2

// Four zones spread around the ring. PERFECT is small + worth more points.
export const ZONES = [
  { id: 'JUMP',    label: 'JUMP',    color: '#39ff14', start: 0,          size: TAU * 0.27, points: 1 },
  { id: 'DUCK',    label: 'DUCK',    color: '#1e90ff', start: TAU * 0.27, size: TAU * 0.27, points: 1 },
  { id: 'BLOCK',   label: 'BLOCK',   color: '#ff4fd8', start: TAU * 0.54, size: TAU * 0.27, points: 1 },
  { id: 'PERFECT', label: 'PERFECT', color: '#ffe600', start: TAU * 0.81, size: TAU * 0.19, points: 3 },
]

export const speedForScore = (score) =>
  Math.min(MAX_SPEED, BASE_SPEED + score * SPEED_PER_POINT)

// Is `angle` (normalized 0..TAU) inside the given zone's arc?
export const angleInZone = (angle, zone) => {
  const a = ((angle % TAU) + TAU) % TAU
  const end = zone.start + zone.size
  if (end <= TAU) return a >= zone.start && a < end
  // wrap-around case
  return a >= zone.start || a < end - TAU
}
