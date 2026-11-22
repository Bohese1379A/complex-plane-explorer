import { useEffect, useMemo, useRef, useState } from 'react'
import type { Complex } from '../math'
import { Plot, Range, pathData } from './Plot'
import { contourIntegral, contourPoint, contourSteps } from './contourMath'
import type { Contour, Pole } from './contourMath'

const firstPole: Pole = { position: { x: 0, y: 0 }, residue: 1 }
const secondPole: Pole = { position: { x: 2, y: 0 }, residue: -1 }
const initial: Contour = { center: { x: 0, y: 0 }, radiusX: 1.4, radiusY: 1.4, direction: 1 }
const format = (x: number) => Number(x.toFixed(4)).toString()
const asComplex = (z: Complex) => `${format(z.x)} ${z.y < -0.00005 ? '−' : '+'} ${format(Math.abs(z.y))}i`

export default function ContourLab() {
  const [path, setPath] = useState(initial)
  const [ellipse, setEllipse] = useState(false)
  const [two, setTwo] = useState(false)
  const [progress, setProgress] = useState(0)
  const [playing, setPlaying] = useState(false)
  const pointerOffset = useRef<Complex>({ x: 0, y: 0 })
  const poles = useMemo(() => two ? [firstPole, secondPole] : [firstPole], [two])
  const result = useMemo(() => contourIntegral(path, poles), [path, poles])
  const samples = useMemo(() => Array.from({ length: contourSteps + 1 }, (_, i) => contourPoint(path, i / contourSteps)), [path])
  const step = Math.round(progress * contourSteps)
  const shown = result.cumulative?.slice(0, step + 1)
  const current = shown?.at(-1)
  const extent = result.cumulative ? Math.max(2, Math.ceil(Math.max(...result.cumulative.flatMap(z => [Math.abs(z.x), Math.abs(z.y)])) / 2) * 2) : 2
  const exact = result.exact
  const exactText = exact && (Math.abs(exact.y) < 1e-12 ? '0' : `${exact.y < 0 ? '−' : ''}2πi`)

  useEffect(() => {
    if (!playing) return
    let frame: number
    let previous = 0
    const tick = (now: number) => {
      if (previous) {
        const change = Math.min(now - previous, 80) / 4700
        setProgress(value => Math.min(1, value + change))
      }
      previous = now
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [playing])
  useEffect(() => {
    if (progress >= 1 || !exact) setPlaying(false)
  }, [progress, exact])

  function example(kind: 'inside' | 'outside' | 'touching' | 'both') {
    setEllipse(false)
    setTwo(kind === 'both')
    setPlaying(false)
    setProgress(0)
    if (kind === 'both') setPath({ ...initial, center: { x: 1, y: 0 }, radiusX: 1.7, radiusY: 1.7 })
    else setPath({ ...initial, center: { x: kind === 'outside' ? -2.5 : kind === 'touching' ? -1.4 : 0, y: 0 } })
  }

  return <main className="experiment-page">
    <header className="lab-heading">
      <h1>围道积分 <span>路径圈住了谁？</span></h1>
      <p>拖动闭合路径，把极点圈进来或留在外面。先猜结果，再看每一段积分怎样累积。</p>
    </header>
    <div className="lab-workspace">
      <div className="lab-graphs">
        <Plot title="积分路径 C" caption="拖动蓝色路径或中心" extent={4.5}
          onPointerDown={(e, p) => {
            if (!(e.target as Element).closest('[data-contour-handle]')) return false
            pointerOffset.current = { x: p.x - path.center.x, y: p.y - path.center.y }
            return true
          }} onPointerMove={p => setPath(old => ({ ...old, center: {
            x: Math.round(Math.max(-3, Math.min(3, p.x - pointerOffset.current.x)) * 100) / 100,
            y: Math.round(Math.max(-3, Math.min(3, p.y - pointerOffset.current.y)) * 100) / 100,
          } }))}>
          {(toPixel, unit) => {
            const center = toPixel(path.center)
            const active = toPixel(samples[step])
            return <>
              <ellipse cx={center.x} cy={center.y} rx={path.radiusX * unit} ry={path.radiusY * unit} className="lab-contour" />
              <ellipse cx={center.x} cy={center.y} rx={path.radiusX * unit} ry={path.radiusY * unit} className="lab-drag-target" data-contour-handle="" />
              <path d={pathData(samples.slice(0, step + 1), toPixel)} className="lab-source-trail" />
              <circle cx={center.x} cy={center.y} r="15" className="lab-grip-hit" data-contour-handle="" />
              <circle cx={center.x} cy={center.y} r="5" className="lab-grip" data-contour-handle="" />
              {poles.map((pole, i) => {
                const p = toPixel(pole.position)
                return <g key={i} className="lab-pole"><circle cx={p.x} cy={p.y} r="8" />
                  <path d={`M${p.x - 3},${p.y - 3} l6,6 m0,-6 l-6,6`} />
                  <text x={p.x + 11} y={p.y - 11}>{pole.residue > 0 ? '+1' : '−1'}</text></g>
              })}
              <circle cx={active.x} cy={active.y} r="6" className="lab-marker" />
            </>
          }}
        </Plot>
        <Plot title="累计积分" caption="绿线随路径前进逐步画出" extent={extent}>
          {toPixel => <>
            {result.cumulative && <path d={pathData(result.cumulative, toPixel)} className="lab-reference-trail" />}
            {shown && <path d={pathData(shown, toPixel)} className="lab-result-trail" />}
            {current && (() => { const p = toPixel(current); return <circle cx={p.x} cy={p.y} r="6" className="lab-result-dot" /> })()}
          </>}
        </Plot>
        <div className="lab-playback">
          <button type="button" className="lab-primary" disabled={!exact} onClick={() => {
            if (playing) setPlaying(false)
            else {
              if (progress >= 1) setProgress(0)
              setPlaying(true)
            }
          }}>{playing ? '暂停' : progress >= 1 ? '重播积分' : '播放积分'}</button>
          <Range label="路径进度" value={Math.round(progress * 1000) / 10} min={0} max={100} step={.1} unit="%" onChange={value => {
            setPlaying(false)
            setProgress(value / 100)
          }} />
          <output className="lab-readout" aria-label="当前累计积分">{current ? asComplex(current) : '未定义'}</output>
        </div>
      </div>
      <aside className="lab-controls">
        <h2>设置路径</h2>
        <div className="lab-pills" aria-label="围道预设">
          <button onClick={() => example('inside')}>圈住原点</button>
          <button onClick={() => example('outside')}>原点在圈外</button>
          <button onClick={() => example('touching')}>碰到极点</button>
          <button onClick={() => example('both')}>圈住两个极点</button>
        </div>
        <label className="lab-select">路径形状<select value={ellipse ? 'ellipse' : 'circle'} onChange={e => {
          const isEllipse = e.target.value === 'ellipse'
          setEllipse(isEllipse)
          setPath(old => ({ ...old, radiusY: isEllipse ? .8 : old.radiusX }))
        }}><option value="circle">圆</option><option value="ellipse">椭圆</option></select></label>
        <label className="lab-select">积分方向<select value={path.direction} onChange={e => setPath({ ...path, direction: e.target.value === '1' ? 1 : -1 })}>
          <option value="1">逆时针</option><option value="-1">顺时针</option>
        </select></label>
        <Range label={ellipse ? '横半轴' : '半径'} value={path.radiusX} min={.3} max={3} step={.1} onChange={radiusX => setPath({ ...path, radiusX, radiusY: ellipse ? path.radiusY : radiusX })} />
        {ellipse && <Range label="纵半轴" value={path.radiusY} min={.3} max={3} step={.1} onChange={radiusY => setPath({ ...path, radiusY })} />}
        <div className="lab-paired">
          <Range label="圆心实部" value={path.center.x} min={-3} max={3} step={.01} onChange={x => setPath({ ...path, center: { ...path.center, x } })} />
          <Range label="圆心虚部" value={path.center.y} min={-3} max={3} step={.01} onChange={y => setPath({ ...path, center: { ...path.center, y } })} />
        </div>
        <label className="lab-check"><input type="checkbox" checked={two} onChange={e => setTwo(e.target.checked)} /> 加入留数为 −1 的极点 z = 2</label>
        <div className={`lab-result ${exact ? '' : 'lab-warning'}`} aria-live="polite">
          <span>{two ? 'f(z) = 1/z − 1/(z − 2)' : 'f(z) = 1/z'}</span>
          <strong>{exact ? `∮ f(z) dz = ${exactText}` : '路径经过极点，积分未定义'}</strong>
          <small>{result.locations.map((where, i) => `z = ${i * 2} ${where === 'on' ? '在路径上' : where === 'in' ? '在圈内' : '在圈外'}`).join(' · ')}</small>
        </div>
      </aside>
    </div>
    <section className="lab-concept"><h2>先猜一个结果</h2>
      <p>用「圈住两个极点」预设，再把方向改成顺时针。积分会不会改变？留数 +1 与 −1 相抵消，两个方向的结果都为 0。接着拖动圆，让其中一个极点离开圈内，再比较。</p>
      <p className="lab-equation">∮<sub>C</sub> f(z) dz = 2πi × 方向 × 圈内留数之和</p>
    </section>
  </main>
}
