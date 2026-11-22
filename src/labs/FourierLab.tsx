import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Range, pathData } from './Plot'
import { amplitudeSpectrum, sampleRate, sampleSignal, signalValue, strongestPeaks } from './fourierMath'
import type { Tone, WindowKind } from './fourierMath'

const initialA: Tone = { frequency: 3, amplitude: 1, phase: 0 }
const initialB: Tone = { frequency: 8, amplitude: .6, phase: 0 }
const format = (n: number) => Number(n.toFixed(3)).toString()

function SignalChart({ title, caption, xMax, yMin, yMax, xUnit, yUnit, xTicks, children }: {
  title: string
  caption: string
  xMax: number
  yMin: number
  yMax: number
  xUnit: string
  yUnit: string
  xTicks: number
  children: (point: (p: { x: number; y: number }) => { x: number; y: number }) => ReactNode
}) {
  const left = 47, right = 459, top = 24, bottom = 229
  const point = (p: { x: number; y: number }) => ({
    x: left + p.x / xMax * (right - left),
    y: bottom - (p.y - yMin) / (yMax - yMin) * (bottom - top),
  })
  const xValues = Array.from({ length: xTicks + 1 }, (_, i) => i / xTicks * xMax)
  const yValues = Array.from({ length: 5 }, (_, i) => yMin + i / 4 * (yMax - yMin))
  return <figure className="lab-chart">
    <figcaption><strong>{title}</strong><span>{caption}</span></figcaption>
    <svg role="img" aria-label={title} viewBox="0 0 480 270">
      {xValues.map(x => <g key={x}>
        <line className="signal-grid" x1={point({ x, y: 0 }).x} x2={point({ x, y: 0 }).x} y1={top} y2={bottom} />
        <text x={point({ x, y: 0 }).x} y={bottom + 18} textAnchor="middle" className="lab-tick">{format(x)}</text>
      </g>)}
      {yValues.map(y => <g key={y}>
        <line className={y === 0 ? 'signal-axis' : 'signal-grid'} x1={left} x2={right} y1={point({ x: 0, y }).y} y2={point({ x: 0, y }).y} />
        <text x={left - 7} y={point({ x: 0, y }).y + 4} textAnchor="end" className="lab-tick">{format(y)}</text>
      </g>)}
      <text className="lab-tick" x={left} y={16}>{yUnit}</text>
      <text className="lab-tick" x={right} y={263} textAnchor="end">{xUnit}</text>
      {children(point)}
    </svg>
  </figure>
}

function ToneControls({ name, tone, setTone }: { name: string; tone: Tone; setTone: (tone: Tone) => void }) {
  return <fieldset className={`tone-controls tone-${name.toLowerCase()}`}>
    <legend>正弦分量 {name}</legend>
    <Range label={`分量 ${name} 的频率`} value={tone.frequency} min={1} max={24} step={.25} unit=" Hz" onChange={frequency => setTone({ ...tone, frequency })} />
    <div className="lab-paired">
      <Range label={`分量 ${name} 的振幅`} value={tone.amplitude} min={0} max={1.5} step={.05} onChange={amplitude => setTone({ ...tone, amplitude })} />
      <Range label={`分量 ${name} 的相位`} value={tone.phase} min={0} max={360} step={5} unit="°" onChange={phase => setTone({ ...tone, phase })} />
    </div>
  </fieldset>
}

export default function FourierLab() {
  const [a, setA] = useState(initialA)
  const [b, setB] = useState(initialB)
  const [duration, setDuration] = useState(1)
  const [window, setWindow] = useState<WindowKind>('rectangular')
  const [components, setComponents] = useState(true)
  const samples = useMemo(() => sampleSignal(a, b, duration), [a, b, duration])
  const bins = useMemo(() => amplitudeSpectrum(samples, window), [samples, window])
  const peaks = strongestPeaks(bins)
  const spectrumLimit = Math.max(1, Math.ceil(Math.max(...bins.map(bin => bin.amplitude)) * 2 + .1) / 2)
  const signalLimit = Math.max(1, Math.ceil((a.amplitude + b.amplitude) * 2) / 2)
  const waveform = Array.from({ length: 513 }, (_, i) => {
    const time = i / 512 * duration
    const first = signalValue(a, time)
    const second = signalValue(b, time)
    return { time, first, second, total: first + second }
  })
  const wavePath = (key: 'first' | 'second' | 'total', point: (z: { x: number; y: number }) => { x: number; y: number }) =>
    pathData(waveform.map(s => ({ x: s.time, y: s[key] })), point)

  function preset(kind: 'two' | 'close' | 'cancel' | 'leakage') {
    setDuration(1)
    setWindow('rectangular')
    if (kind === 'close') {
      setA({ ...initialA, frequency: 6 })
      setB({ ...initialB, frequency: 6.5, amplitude: 1 })
    } else if (kind === 'cancel') {
      setA({ ...initialA, frequency: 5 })
      setB({ frequency: 5, amplitude: 1, phase: 180 })
    } else if (kind === 'leakage') {
      setA({ ...initialA, frequency: 4.5 })
      setB({ ...initialB, amplitude: 0 })
    } else {
      setA(initialA)
      setB(initialB)
    }
  }

  return <main className="experiment-page">
    <header className="lab-heading">
      <h1>傅里叶调音台 <span>从波形看见频率</span></h1>
      <p>混合两条正弦波。左图显示相加后的波形，右图用离散傅里叶变换找出频率成分。</p>
    </header>
    <div className="lab-workspace">
      <div className="lab-graphs">
        <SignalChart title="时域波形" caption={`采样率 ${sampleRate} Hz · ${samples.length} 个样本`} xMax={duration} yMin={-signalLimit} yMax={signalLimit} xUnit="时间 / s" yUnit="幅值" xTicks={4}>
          {point => <>
            {components && <path d={wavePath('first', point)} className="signal-a" />}
            {components && <path d={wavePath('second', point)} className="signal-b" />}
            <path d={wavePath('total', point)} className="signal-sum" />
            {samples.length <= 128 && samples.map((y, i) => {
              const p = point({ x: i / sampleRate, y })
              return <circle key={i} cx={p.x} cy={p.y} r="1.7" className="signal-sample" />
            })}
          </>}
        </SignalChart>
        <SignalChart title="单边振幅谱" caption={`频点间隔 Δf = ${format(1 / duration)} Hz`} xMax={sampleRate / 2} yMin={0} yMax={spectrumLimit} xUnit="频率 / Hz" yUnit="振幅" xTicks={4}>
          {point => bins.filter(bin => bin.amplitude > 1e-6).map(bin => {
            const end = point({ x: bin.frequency, y: bin.amplitude })
            const isPeak = peaks.includes(bin)
            return <g key={bin.frequency} className={isPeak ? 'signal-peak' : 'signal-stem'}>
              <line x1={end.x} x2={end.x} y1={point({ x: bin.frequency, y: 0 }).y} y2={end.y} />
              <circle cx={end.x} cy={end.y} r={isPeak ? 3.5 : 2} />
              <title>{format(bin.frequency)} Hz · 振幅 {format(bin.amplitude)}</title>
            </g>
          })}
        </SignalChart>
        <div className="signal-key">
          <label className="lab-check"><input type="checkbox" checked={components} onChange={e => setComponents(e.target.checked)} /> 显示分量 A、B</label>
          {components && <><span className="signal-key-a">虚线 A</span><span className="signal-key-b">点线 B</span></>}
          <span className="signal-key-sum">实线 A + B</span>
        </div>
        <section className="signal-peaks" aria-label="频谱峰值">
          <h2>频谱峰值</h2>
          {peaks.length === 0 ? <p>未检出振幅峰。两分量都静音或相互抵消时，合成信号为零。</p> : <ul>
            {peaks.map(bin => <li key={bin.frequency}><strong>{format(bin.frequency)} Hz</strong><span>振幅 {format(bin.amplitude)}</span></li>)}
          </ul>}
        </section>
      </div>
      <aside className="lab-controls">
        <h2>混合信号</h2>
        <div className="lab-pills" aria-label="调音台预设">
          <button onClick={() => preset('two')}>两个频率</button>
          <button onClick={() => preset('close')}>接近的频率</button>
          <button onClick={() => preset('cancel')}>反相抵消</button>
          <button onClick={() => preset('leakage')}>频谱泄漏</button>
        </div>
        <ToneControls name="A" tone={a} setTone={setA} />
        <ToneControls name="B" tone={b} setTone={setB} />
        <label className="lab-select">观察时长<select value={duration} onChange={e => setDuration(Number(e.target.value))}>
          <option value="0.5">0.5 秒</option><option value="1">1 秒</option><option value="2">2 秒</option><option value="4">4 秒</option>
        </select></label>
        <label className="lab-select">窗函数<select value={window} onChange={e => setWindow(e.target.value as WindowKind)}>
          <option value="rectangular">矩形窗</option><option value="hann">汉宁窗（Hann）</option>
        </select></label>
      </aside>
    </div>
    <section className="lab-concept">
      <h2>试试「频谱泄漏」</h2>
      <p>4.5 Hz 在 1 秒内恰好振动 4.5 次，落在频谱的两个频点之间，振幅就会散到附近频点。把观察时长改成 2 秒，4.5 Hz 正好对齐一个频点。切换汉宁窗可以压低远处的泄漏，但会让主峰变宽。也可以选「接近的频率」，比较 1 秒和 4 秒的频谱。</p>
      <p className="lab-equation">频点间隔 Δf = 采样率 / 样本数 = 1 / 观察时长</p>
    </section>
  </main>
}
