export type Tone = { frequency: number; amplitude: number; phase: number }
export type WindowKind = 'rectangular' | 'hann'
export type SpectrumBin = { frequency: number; amplitude: number }

export const sampleRate = 64

export function signalValue(tone: Tone, time: number) {
  return tone.amplitude * Math.sin(2 * Math.PI * tone.frequency * time + tone.phase * Math.PI / 180)
}

export function sampleSignal(a: Tone, b: Tone, duration: number) {
  const count = Math.round(duration * sampleRate)
  return Array.from({ length: count }, (_, n) => {
    const time = n / sampleRate
    return signalValue(a, time) + signalValue(b, time)
  })
}

export function amplitudeSpectrum(samples: readonly number[], window: WindowKind): SpectrumBin[] {
  const count = samples.length
  if (count === 0) return []
  const weights = samples.map((_, n) =>
    window === 'hann' ? .5 - .5 * Math.cos(2 * Math.PI * n / count) : 1)
  const normalization = weights.reduce((sum, weight) => sum + weight, 0)
  if (normalization === 0) return []
  const weighted = samples.map((sample, n) => sample * weights[n])
  return Array.from({ length: Math.floor(count / 2) + 1 }, (_, k) => {
    let re = 0
    let im = 0
    for (let n = 0; n < count; n++) {
      const phase = 2 * Math.PI * k * n / count
      re += weighted[n] * Math.cos(phase)
      im -= weighted[n] * Math.sin(phase)
    }
    // Negative frequencies are folded into the positive half for a real signal.
    // DC and the Nyquist bin (for even N) have no distinct partner.
    const factor = k === 0 || k * 2 === count ? 1 : 2
    return { frequency: k * sampleRate / count, amplitude: factor * Math.hypot(re, im) / normalization }
  })
}

export function strongestPeaks(bins: readonly SpectrumBin[], count = 3) {
  return bins.filter((bin, i) => {
    const previous = bins[i - 1]?.amplitude ?? 0
    const next = bins[i + 1]?.amplitude ?? 0
    return bin.amplitude > 1e-6 && bin.amplitude >= previous && bin.amplitude > next
  }).sort((a, b) => b.amplitude - a.amplitude).slice(0, count)
}
