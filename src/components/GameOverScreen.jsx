import { useEffect } from 'react'

export default function GameOverScreen({ score, best, onRestart }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.code === 'Space' || e.key === ' ') { e.preventDefault(); onRestart() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onRestart])

  return (
    <div style={wrap}>
      <h1 style={{ fontSize: 28, color: '#ff3b3b', textShadow: '0 0 14px #ff3b3b' }}>GAME OVER</h1>
      <div style={{ fontSize: 14, lineHeight: 2 }}>
        <div style={{ color: '#ffe600' }}>SCORE {score}</div>
        <div style={{ color: '#39ff14' }}>BEST {best}</div>
      </div>
      <button onClick={onRestart} style={btn}>RETRY</button>
    </div>
  )
}

const wrap = { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 26, textAlign: 'center' }
const btn = {
  fontFamily: 'inherit', fontSize: 14, color: '#0a0a12', background: '#39ff14',
  border: 'none', padding: '16px 22px', cursor: 'pointer', boxShadow: '0 0 18px #39ff14',
}
