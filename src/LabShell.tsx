import { useEffect, useState } from 'react'
import App from './App'
import ContourLab from './labs/ContourLab'
import DerivativeLab from './labs/DerivativeLab'
import './labs/labs.css'

const tabs = [
  { id: 'multiply', label: '复数乘法' },
  { id: 'contour', label: '围道积分' },
  { id: 'derivative', label: '复导数探针' },
] as const

type LabId = (typeof tabs)[number]['id']
function activeLab(): LabId {
  const id = window.location.hash.slice(1)
  return tabs.find(tab => tab.id === id)?.id ?? 'multiply'
}

export default function LabShell() {
  const [lab, setLab] = useState(activeLab)
  useEffect(() => {
    const update = () => {
      const next = activeLab()
      setLab(next)
      if (tabs.some(tab => `#${tab.id}` === window.location.hash)) {
        window.scrollTo({ top: 0, behavior: 'instant' })
      }
    }
    window.addEventListener('hashchange', update)
    return () => window.removeEventListener('hashchange', update)
  }, [])
  return <>
    <nav className="lab-nav" aria-label="实验室导航">
      <span className="lab-nav-name">复数几何实验室</span>
      {tabs.map(tab => <a key={tab.id} href={`#${tab.id}`} aria-current={tab.id === lab ? 'page' : undefined}>{tab.label}</a>)}
    </nav>
    {lab === 'contour' && <ContourLab />}
    {lab === 'derivative' && <DerivativeLab />}
    {lab === 'multiply' && <App />}
  </>
}
