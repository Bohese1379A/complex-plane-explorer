export type Complex = { x: number; y: number }
export const multiply = (a: Complex, b: Complex): Complex => ({ x: a.x * b.x - a.y * b.y, y: a.x * b.y + a.y * b.x })
export const modulus = (z: Complex) => Math.hypot(z.x, z.y)
export const argument = (z: Complex): number | null => z.x === 0 && z.y === 0 ? null : (Math.atan2(z.y, z.x) === -Math.PI ? Math.PI : Math.atan2(z.y, z.x))
export const deg = (r: number) => r * 180 / Math.PI
export function fmt(n: number, digits = 3) { return n === 0 ? '0' : Math.abs(n) >= 1e7 || Math.abs(n) < 1e-3 ? n.toExponential(2) : Number(n.toFixed(digits)).toString() }
export const algebra = (z: Complex) => `${fmt(z.x)} ${z.y < 0 ? '−' : '+'} ${fmt(Math.abs(z.y))}i`
export const angleText = (z: Complex) => argument(z) === null ? '未定义' : `${fmt(deg(argument(z)! ), 1)}°`
// Continuous path from the identity to multiplication by z. At z=0 no angle is assigned.
export function interpolation(z: Complex, t: number): Complex {
  if (t === 0) return { x: 1, y: 0 }
  if (t === 1) return z
  const r = 1 + (modulus(z) - 1) * t
  const theta = (argument(z) ?? 0) * t
  return { x: r * Math.cos(theta), y: r * Math.sin(theta) }
}
export const presets = [
  { title: '2', tag: '放大', x: 2, y: 0, detail: '模为 2，辐角为 0°。方向不变，长度扩大到 2 倍。' },
  { title: '½', tag: '缩小', x: .5, y: 0, detail: '模为 1/2，辐角为 0°。方向不变，长度缩小到一半。' },
  { title: 'i', tag: '左转 90°', x: 0, y: 1, detail: '模为 1，辐角为 90°。长度不变，逆时针旋转 90°。' },
  { title: '−i', tag: '右转 90°', x: 0, y: -1, detail: '模为 1，辐角为 −90°。长度不变，顺时针旋转 90°。' },
  { title: '−1', tag: '旋转 180°', x: -1, y: 0, detail: '模为 1，主辐角为 180°。向量转向相反方向。' },
  { title: '1 + i', tag: '伸缩 + 旋转', x: 1, y: 1, detail: '模为 √2，辐角为 45°。扩大 √2 倍，逆时针旋转 45°。' },
  { title: '√3 + i', tag: '放大 + 左转', x: Math.sqrt(3), y: 1, detail: '模为 2，辐角为 30°。扩大 2 倍，逆时针旋转 30°。' },
  { title: 'cos 60° + i sin 60°', tag: '左转 60°', x: .5, y: Math.sqrt(3) / 2, detail: '模为 1，辐角为 π/3。长度不变，逆时针旋转 60°。' },
]
