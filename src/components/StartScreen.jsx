import { useEffect } from 'react'
import { ZONES } from '../constants/zones.js'

export default function StartScreen({ onStart }) {
  // Let spacebar start the game too.
  useEffect(() => {
    const onKey = (e) => {
      if (e.code === 'Space' || e.key === ' ') { e.preventDefault(); onStart() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onStart])

  return (
    <div style={wrap}>
      <h1 style={{ fontSize: 34, lineHeight: 1.4, textShadow: '0 0 14px #39ff14' }}>
        ONE<br />BUTTON
      </h1>
      <div style={howTo}>
        <p style={howToTitle}>HOW TO PLAY</p>
        <ol style={steps}>
          <li>A GLOWING MARKER SPINS AROUND THE RING.</li>
          <li>ONE ZONE LIGHTS UP — THAT'S YOUR TARGET.</li>
          <li>TAP THE SCREEN (OR PRESS SPACE) THE INSTANT THE MARKER CROSSES THE LIT ZONE.</li>
          <li>NAIL IT → SCORE POINTS. MISS → LOSE A LIFE.</li>
        </ol>
        <p style={{ fontSize: 9, color: '#ff4fd8' }}>♥ ♥ ♥ &nbsp; 3 LIVES &nbsp;·&nbsp; EVERY HIT MAKES IT FASTER</p>
      </div>

      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
        {ZONES.map((z) => (
          <span key={z.id} style={{ fontSize: 9, color: z.color }}>
            {z.label} {z.points}PT
          </span>
        ))}
      </div>
      <button onClick={onStart} style={btn}>PRESS START</button>
      <p style={{ fontSize: 8, color: '#555', marginTop: 8 }}>v1 · BUILT BY PREETI</p>
    </div>
  )
}

const wrap = { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 26, textAlign: 'center' }
const howTo = {
  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
  maxWidth: 380, padding: '18px 20px', border: '1px solid #2a2a3a', borderRadius: 8,
}
const howToTitle = { fontSize: 11, color: '#39ff14', letterSpacing: 2, margin: 0 }
const steps = {
  margin: 0, paddingLeft: 18, textAlign: 'left',
  fontSize: 9, color: '#aaa', lineHeight: 2.1, display: 'flex', flexDirection: 'column', gap: 4,
}
const btn = {
  fontFamily: 'inherit', fontSize: 14, color: '#0a0a12', background: '#ffe600',
  border: 'none', padding: '16px 22px', cursor: 'pointer', boxShadow: '0 0 18px #ffe600',
}
