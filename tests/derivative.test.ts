import { test } from 'node:test'
import assert from 'node:assert/strict'
import { differenceQuotient, exponential, polar } from '../src/labs/derivativeMath.ts'

const z = { x: .35, y: -.76 }
const close = (actual: number, expected: number, tolerance = 1e-12) =>
  assert.ok(Math.abs(actual - expected) < tolerance, `${actual} != ${expected}`)

test('conjugate quotients disagree along real, imaginary and diagonal directions', () => {
  for (const r of [1, .002, 1e-12]) {
    close(differenceQuotient('conjugate', z, { x: r, y: 0 })!.x, 1)
    close(differenceQuotient('conjugate', z, { x: 0, y: r })!.x, -1)
    const diagonal = differenceQuotient('conjugate', z, { x: r, y: r })!
    close(diagonal.x, 0)
    close(diagonal.y, -1)
  }
})
test('exponential quotients converge to exp(z) along distinct directions and retain precision', () => {
  const expected = exponential(z)
  for (const theta of [0, Math.PI / 2, .3, 2.6, 4.2]) {
    const distances = [.1, .01, .001, 1e-12].map(r => {
      const q = differenceQuotient('exp', z, polar(r, theta))!
      return Math.hypot(q.x - expected.x, q.y - expected.y)
    })
    assert.ok(distances.every((value, i) => i === 0 || value < distances[i - 1]))
    assert.ok(distances.at(-1)! < 2e-12)
  }
})
test('zero increment has no difference quotient', () => {
  assert.equal(differenceQuotient('exp', z, { x: 0, y: 0 }), null)
  assert.equal(differenceQuotient('conjugate', z, { x: 0, y: 0 }), null)
})
