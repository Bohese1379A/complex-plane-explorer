import { useId } from 'react'
import type { PointerEvent, ReactNode } from 'react'
import type { Complex } from '../math'

const width = 440
const height = 322
const centerX = 220
const centerY = 157
const plotRadius = 132

export function Plot({ title, caption, extent, children, onPointerDown, onPointerMove }: {
  title: string
  caption: string
  extent: number
  children: (point: (z: Complex) => Complex, unit: number) => ReactNode
  onPointerDown?: (event: PointerEvent<SVGSVGElement>, point: Complex) => boolean
  onPointerMove?: (point: Complex) => void
}) {
  const id = useId()
  const unit = plotRadius / extent
  const point = (z: Complex) => ({ x: centerX + unit * z.x, y: centerY - unit * z.y })
  const tickSize = extent <= 1.5 ? .5 : extent <= 5 ? 1 : extent <= 10 ? 2 : extent <= 25 ? 5 : 10
  const ticks = Array.from({ length: Math.ceil(extent / tickSize) * 2 + 1 },
    (_, i) => (i - Math.ceil(extent / tickSize)) * tickSize)
  const location = (e: PointerEvent<SVGSVGElement>) => {
    const matrix = e.currentTarget.getScreenCTM()
    if (!matrix) return null
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(matrix.inverse())
    return { x: (p.x - centerX) / unit, y: (centerY - p.y) / unit }
  }
  return <figure className="lab-chart">
    <figcaption><strong>{title}</strong><span>{caption}</span></figcaption>
    <svg aria-label={title} viewBox={`0 0 ${width} ${height}`} className={onPointerDown ? 'lab-interactive' : undefined}
      onPointerDown={e => {
        if (e.button !== 0 || !e.isPrimary || !onPointerDown) return
        const p = location(e)
        if (p && onPointerDown(e, p)) e.currentTarget.setPointerCapture(e.pointerId)
      }}
      onPointerMove={e => {
        if (!onPointerMove || !e.currentTarget.hasPointerCapture(e.pointerId)) return
        const p = location(e)
        if (p) onPointerMove(p)
      }}>
      <defs><clipPath id={id}><rect x="18" y="15" width="404" height="280" /></clipPath></defs>
      <g clipPath={`url(#${id})`}>
        {ticks.filter(n => n !== 0).map(n => <g key={n} className="lab-grid">
          <line x1={point({ x: n, y: 0 }).x} x2={point({ x: n, y: 0 }).x} y1="15" y2="295" />
          <line y1={point({ x: 0, y: n }).y} y2={point({ x: 0, y: n }).y} x1="18" x2="422" />
        </g>)}
        <g className="lab-axis"><line x1="18" x2="422" y1={centerY} y2={centerY} />
          <line x1={centerX} x2={centerX} y1="15" y2="295" /></g>
        {ticks.filter(n => n !== 0).map(n => <g key={n} className="lab-tick">
          <text x={point({ x: n, y: 0 }).x} y={centerY + 16} textAnchor="middle">{n}</text>
          <text x={centerX - 7} y={point({ x: 0, y: n }).y + 4} textAnchor="end">{n}</text>
        </g>)}
        {children(point, unit)}
      </g>
      <g className="lab-tick"><text x="394" y="176">Re</text><text x="228" y="25">Im</text><text x="207" y="174">0</text></g>
    </svg>
  </figure>
}

export function pathData(points: readonly Complex[], toPixel: (z: Complex) => Complex) {
  return points.map((z, index) => {
    const { x, y } = toPixel(z)
    return `${index ? 'L' : 'M'}${x.toFixed(2)},${y.toFixed(2)}`
  }).join(' ')
}

export function Range({ label, value, min, max, step, unit = '', onChange }: {
  label: string
  value: number
  min: number
  max: number
  step: number
  unit?: string
  onChange: (value: number) => void
}) {
  return <label className="lab-range">
    <span>{label}<output>{Number(value.toFixed(3))}{unit}</output></span>
    <input aria-label={label} type="range" {...{ min, max, step, value }} onChange={e => onChange(e.target.valueAsNumber)} />
  </label>
}
