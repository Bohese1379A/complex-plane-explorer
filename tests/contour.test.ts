import { test } from 'node:test'
import assert from 'node:assert/strict'
import { contourIntegral, contourSteps } from '../src/labs/contourMath.ts'
import type { Contour, Pole } from '../src/labs/contourMath.ts'

const origin: Pole = { position: { x: 0, y: 0 }, residue: 1 }
const other: Pole = { position: { x: 2, y: 0 }, residue: -1 }
const near = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-7, `${a} != ${b}`)
const circle: Contour = { center: { x: 0, y: 0 }, radiusX: 1.4, radiusY: 1.4, direction: 1 }

test('centered circle produces a continuous imaginary integral with signed direction', () => {
  for (const direction of [1, -1] as const) {
    const result = contourIntegral({ ...circle, direction }, [origin])
    assert.deepEqual(result.locations, ['in'])
    near(result.exact!.y, direction * 2 * Math.PI)
    for (const fraction of [.25, .5, 1]) {
      const z = result.cumulative![contourSteps * fraction]
      near(z.x, 0)
      near(z.y, direction * fraction * 2 * Math.PI)
    }
  }
})
test('outside and touching poles are distinguished', () => {
  const outside = contourIntegral({ ...circle, center: { x: -2.5, y: 0 } }, [origin])
  assert.equal(outside.locations[0], 'out')
  near(outside.cumulative!.at(-1)!.y, 0)
  const on = contourIntegral({ ...circle, center: { x: -1.4, y: 0 } }, [origin])
  assert.equal(on.locations[0], 'on')
  assert.equal(on.exact, null)
  assert.equal(on.cumulative, null)
})
test('nonsymmetric ellipse contains both opposite residues and cancels them', () => {
  const result = contourIntegral({ ...circle, center: { x: 1.1, y: .1 }, radiusX: 2, radiusY: .75 }, [origin, other])
  assert.deepEqual(result.locations, ['in', 'in'])
  near(result.exact!.y, 0)
  near(result.cumulative!.at(-1)!.x, 0)
  near(result.cumulative!.at(-1)!.y, 0)
  assert.ok(Math.abs(result.cumulative![60].y) > .1)
})
test('very close inside and outside ellipse paths still give the correct total', () => {
  for (const direction of [1, -1] as const) {
    for (const angle of [0, .023, .9, 3.4, 6.27]) {
      for (const scale of [1 - 1e-7, 1 + 1e-7]) {
        const ellipse = { ...circle, radiusX: 3, radiusY: .3, direction }
        const pole = { ...origin, position: { x: ellipse.radiusX * scale * Math.cos(angle), y: ellipse.radiusY * scale * Math.sin(angle) } }
        const result = contourIntegral(ellipse, [pole])
        near(result.cumulative!.at(-1)!.y, scale < 1 ? direction * 2 * Math.PI : 0)
      }
    }
  }
})
