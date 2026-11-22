import { useState } from 'react'
import type { Complex } from '../math'
import { Plot, Range, pathData } from './Plot'
import { differenceQuotient, exponential, polar } from './derivativeMath'
import type { ProbeFunction } from './derivativeMath'

const toRadians = Math.PI / 180
const format = (n: number) => Number(n.toFixed(5)).toString()
const signed = (z: Complex) => `${format(z.x)} ${z.y < -0.000005 ? '−' : '+'} ${format(Math.abs(z.y))}i`
const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))

export default function DerivativeLab() {
  const [kind, setKind] = useState<ProbeFunction>('exp')
  const [base, setBase] = useState<Complex>({ x: .35, y: .5 })
  const [angle, setAngle] = useState(35)
  const [logStep, setLogStep] = useState(-.3)
  const [showLocus, setShowLocus] = useState(true)
  const length = 10 ** logStep
  const h = polar(length, angle * toRadians)
  const tip = { x: base.x + h.x, y: base.y + h.y }
  const quotient = (displacement: Complex) => differenceQuotient(kind, base, displacement)!
  const q = quotient(h)
  const realProbe = quotient({ x: length, y: 0 })
  const imagProbe = quotient({ x: 0, y: length })
  const limit = kind === 'exp' ? exponential(base) : null
  const error = limit ? Math.hypot(q.x - limit.x, q.y - limit.y) : null
  const locus = Array.from({ length: 129 }, (_, i) => quotient(polar(length, i / 128 * 2 * Math.PI)))
  const extent = Math.max(1.5, Math.ceil(Math.max(...locus.map(z => Math.hypot(z.x, z.y)), limit ? Math.hypot(limit.x, limit.y) : 0) * 1.18 * 2) / 2)

  function steer(point: Complex) {
    const dx = point.x - base.x
    const dy = point.y - base.y
    if (Math.hypot(dx, dy) > 1e-8) {
      setAngle((Math.round(Math.atan2(dy, dx) / toRadians) + 360) % 360)
      setLogStep(clamp(Math.round(Math.log10(Math.hypot(dx, dy)) * 20) / 20, -3, 0))
    }
  }

  return <main className="experiment-page">
    <header className="lab-heading">
      <h1>复导数探针 <span>从不同方向靠近</span></h1>
      <p>转动位移 h，再把它缩短。比较各个方向的差商是否趋向同一个复数。</p>
    </header>
    <div className="lab-workspace">
      <div className="lab-graphs">
        <Plot title="输入平面：z₀ 和 z₀ + h" caption="拖动蓝点改变 h" extent={2.5}
          onPointerDown={(_e, p) => { steer(p); return true }} onPointerMove={steer}>
          {(point, unit) => {
            const root = point(base)
            const end = point(tip)
            return <>
              <circle cx={root.x} cy={root.y} r={unit * length} className="probe-orbit" />
              <line x1={root.x} y1={root.y} x2={end.x} y2={end.y} className="probe-vector" />
              <circle cx={root.x} cy={root.y} r="5.5" className="probe-root" />
              <circle cx={end.x} cy={end.y} r="7" className="probe-tip" />
              <text x={root.x - 10} y={root.y + 21} textAnchor="end" className="probe-label">z₀</text>
              <text x={end.x + 10} y={end.y - 9} className="probe-label">z₀ + h</text>
            </>
          }}
        </Plot>
        <Plot title="差商平面：Δf / h" caption="细圈表示同一 |h| 下的所有方向" extent={extent}>
          {point => {
            const qr = point(realProbe), qi = point(imagProbe), current = point(q)
            const target = limit && point(limit)
            return <>
              {showLocus && <path d={pathData(locus, point)} className="probe-orbit" />}
              {target && <g className="probe-target">
                <path d={`M${target.x - 6},${target.y} h12 m-6,-6 v12`} />
                <text x={target.x - 10} y={target.y - 10} textAnchor="end" className="probe-label">f′(z₀)</text>
              </g>}
              <rect x={qr.x - 4} y={qr.y - 4} width="8" height="8" className="probe-real" />
              <path d={`M${qi.x},${qi.y - 5} l5,5 l-5,5 l-5,-5 Z`} className="probe-imag" />
              <circle cx={current.x} cy={current.y} r="7" className="probe-tip probe-q" />
            </>
          }}
        </Plot>
        <div className="probe-stats">
          <div><span>■ 实轴方向</span><strong>{signed(realProbe)}</strong></div>
          <div><span>◆ 虚轴方向</span><strong>{signed(imagProbe)}</strong></div>
          <div><span>● 当前方向</span><strong>{signed(q)}</strong></div>
        </div>
      </div>
      <aside className="lab-controls">
        <h2>改变探针</h2>
        <div className="lab-pills" aria-label="探测函数">
          <button aria-pressed={kind === 'exp'} onClick={() => setKind('exp')}>指数函数 eᶻ</button>
          <button aria-pressed={kind === 'conjugate'} onClick={() => setKind('conjugate')}>共轭函数 z̄</button>
        </div>
        <div className="lab-paired">
          <Range label="z₀ 实部" value={base.x} min={-1} max={1} step={.05} onChange={x => setBase({ ...base, x })} />
          <Range label="z₀ 虚部" value={base.y} min={-1} max={1} step={.05} onChange={y => setBase({ ...base, y })} />
        </div>
        <Range label="探针方向" value={angle} min={0} max={359} step={1} unit="°" onChange={setAngle} />
        <div className="lab-pills">
          <button onClick={() => setAngle(0)}>沿实轴</button>
          <button onClick={() => setAngle(90)}>沿虚轴</button>
          <button onClick={() => setAngle(45)}>45°</button>
        </div>
        <label className="lab-range"><span>位移长度 |h| <output>{format(length)}</output></span>
          <input aria-label="位移长度 |h|" aria-valuetext={format(length)} type="range" min="-3" max="0" step=".05" value={logStep}
            onChange={e => setLogStep(e.target.valueAsNumber)} />
        </label>
        <div className="lab-pills">
          <button disabled={logStep === -3} onClick={() => setLogStep(Math.max(-3, logStep - 1))}>缩小 10 倍</button>
          <button onClick={() => setLogStep(-.3)}>恢复位移</button>
        </div>
        <label className="lab-check"><input type="checkbox" checked={showLocus} onChange={e => setShowLocus(e.target.checked)} /> 显示各方向的差商轨迹</label>
        <div className={`lab-result ${limit ? '' : 'lab-warning'}`} aria-live="polite">
          <span>复导数</span>
          <strong>{limit ? `f′(z₀) = ${signed(limit)}` : '极限依赖方向，复导数不存在'}</strong>
          <small>{error === null ? '无论 |h| 缩小多少，实轴差商为 1，虚轴差商为 −1。' : `当前差商到极限的距离为 ${format(error)}`}</small>
        </div>
      </aside>
    </div>
    <section className="lab-concept">
      <h2>把位移连续缩小</h2>
      <p>先选指数函数，连续按「缩小 10 倍」，看右图的轨迹收拢到 f′(z₀)。再选共轭函数重复。共轭的差商为 h̄/h，取决于方向，所以右图始终是单位圆。</p>
      <p className="lab-equation">f′(z₀) = lim<sub>h → 0</sub> [f(z₀ + h) − f(z₀)] / h</p>
    </section>
  </main>
}
