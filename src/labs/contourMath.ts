import type { Complex } from '../math.ts'

export type Contour = { center: Complex; radiusX: number; radiusY: number; direction: 1 | -1 }
export type Pole = { position: Complex; residue: number }

const turn = 2 * Math.PI
export const contourSteps = 240
export const contourPoint = (path: Contour, t: number): Complex => ({
  x: path.center.x + path.radiusX * Math.cos(path.direction * turn * t),
  y: path.center.y + path.radiusY * Math.sin(path.direction * turn * t),
})

function relativePosition(path: Contour, pole: Pole) {
  return {
    x: (pole.position.x - path.center.x) / path.radiusX,
    y: (pole.position.y - path.center.y) / path.radiusY,
  }
}

export function poleLocation(path: Contour, pole: Pole) {
  const relative = relativePosition(path, pole)
  const radius = Math.hypot(relative.x, relative.y)
  if (Math.abs(radius - 1) <= 1e-9) return 'on'
  return radius < 1 ? 'in' : 'out'
}

export function contourIntegral(path: Contour, poles: readonly Pole[]) {
  const locations = poles.map(pole => poleLocation(path, pole))
  if (locations.includes('on')) return { locations, cumulative: null, exact: null }

  const cumulative = Array.from({ length: contourSteps + 1 }, () => ({ x: 0, y: 0 }))
  for (const pole of poles) {
    const radial = relativePosition(path, pole)
    const radialTurns = path.direction * Math.atan2(radial.y, radial.x) / turn
    const nearest = (radialTurns + 1) % 1
    let phase = 0
    const displacement = (t: number) => {
      const z = contourPoint(path, t)
      return { x: z.x - pole.position.x, y: z.y - pole.position.y }
    }
    const initial = displacement(0)
    const initialLog = Math.log(Math.hypot(initial.x, initial.y))
    let previous = initial
    const phaseChange = (a: Complex, b: Complex) =>
      Math.atan2(a.x * b.y - a.y * b.x, a.x * b.x + a.y * b.y)
    for (let i = 1; i <= contourSteps; i++) {
      const t = i / contourSteps
      const current = displacement(t)
      // Split the arc at the radial ray through the pole so a tiny gap to the path
      // cannot hide a nearly full turn of the local argument within one sample.
      if (nearest > (i - 1) / contourSteps && nearest < t) {
        const midpoint = displacement(nearest)
        phase += phaseChange(previous, midpoint) + phaseChange(midpoint, current)
      } else {
        phase += phaseChange(previous, current)
      }
      cumulative[i].x += pole.residue * (Math.log(Math.hypot(current.x, current.y)) - initialLog)
      cumulative[i].y += pole.residue * phase
      previous = current
    }
  }
  const residueSum = poles.reduce((sum, pole, i) => locations[i] === 'in' ? sum + pole.residue : sum, 0)
  return { locations, cumulative, exact: { x: 0, y: turn * path.direction * residueSum } }
}
