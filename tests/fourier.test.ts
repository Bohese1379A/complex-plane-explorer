import { test } from 'node:test'
import assert from 'node:assert/strict'
import { amplitudeSpectrum, sampleRate, sampleSignal, strongestPeaks } from '../src/labs/fourierMath.ts'

const a = { frequency: 3, amplitude: 1, phase: 0 }
const b = { frequency: 8, amplitude: .6, phase: 0 }
const close = (actual: number, expected: number, tolerance = 1e-10) =>
  assert.ok(Math.abs(actual - expected) < tolerance, `${actual} != ${expected}`)

test('DFT finds the amplitudes and frequencies of two mixed tones', () => {
  for (const window of ['rectangular', 'hann'] as const) {
    const bins = amplitudeSpectrum(sampleSignal(a, b, 1), window)
    const peaks = strongestPeaks(bins)
    assert.deepEqual(peaks.map(p => p.frequency), [3, 8])
    close(peaks[0].amplitude, 1)
    close(peaks[1].amplitude, .6)
  }
})
test('opposite same-frequency components cancel both in the waveform and in its spectrum', () => {
  const samples = sampleSignal(a, { ...a, phase: 180 }, 1)
  assert.ok(samples.every(value => Math.abs(value) < 1e-12))
  assert.deepEqual(strongestPeaks(amplitudeSpectrum(samples, 'rectangular')), [])
})
test('longer duration moves a non-bin tone onto a bin and rectangular-window leakage falls', () => {
  const tone = { ...a, frequency: 4.5 }
  const quiet = { ...b, amplitude: 0 }
  const short = amplitudeSpectrum(sampleSignal(tone, quiet, 1), 'rectangular')
  const long = amplitudeSpectrum(sampleSignal(tone, quiet, 2), 'rectangular')
  assert.equal(short[1].frequency, 1)
  assert.equal(long[1].frequency, .5)
  assert.ok(short.filter(bin => bin.amplitude > .05).length > 2)
  const peaks = strongestPeaks(long)
  assert.equal(peaks.length, 1)
  close(peaks[0].frequency, 4.5)
  close(peaks[0].amplitude, 1)
})
test('DC and Nyquist amplitudes are not accidentally doubled', () => {
  const samples = Array.from({ length: sampleRate }, (_, i) => 2 + (-1) ** i * .7)
  const bins = amplitudeSpectrum(samples, 'rectangular')
  close(bins[0].amplitude, 2)
  close(bins.at(-1)!.frequency, 32)
  close(bins.at(-1)!.amplitude, .7)
})
