import { multiply } from '../math.ts'
import type { Complex } from '../math.ts'

export type ProbeFunction = 'exp' | 'conjugate'
export const polar = (r: number, theta: number): Complex => ({ x: r * Math.cos(theta), y: r * Math.sin(theta) })

export function exponential(z: Complex): Complex {
  return polar(Math.exp(z.x), z.y)
}

export function differenceQuotient(kind: ProbeFunction, z: Complex, h: Complex): Complex | null {
  const length = Math.hypot(h.x, h.y)
  if (length === 0) return null
  const unit = { x: h.x / length, y: -h.y / length }
  if (kind === 'conjugate') return multiply(unit, unit)

  // Evaluate e^h - 1 without subtracting two almost equal real numbers.
  const sinHalf = Math.sin(h.y / 2)
  const delta = {
    x: Math.expm1(h.x) * Math.cos(h.y) - 2 * sinHalf ** 2,
    y: Math.exp(h.x) * Math.sin(h.y),
  }
  return multiply(exponential(z), multiply({ x: delta.x / length, y: delta.y / length }, unit))
}
