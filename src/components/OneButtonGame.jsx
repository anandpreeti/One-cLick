import { useCallback, useEffect, useRef, useState } from 'react'
import { useGameLoop } from '../hooks/useGameLoop.js'
import {
  CANVAS_SIZE, RING_RADIUS, RING_WIDTH, FLASH_MS, START_LIVES,
  ZONES, speedForScore, angleInZone,
} from '../constants/zones.js'

const TAU = Math.PI * 2
const CENTER = CANVAS_SIZE / 2
// Display size: never wider than the canvas, but shrink to fit narrow (mobile) screens.
const FIELD = `min(${CANVAS_SIZE}px, 92vw)`
const pickTarget = (exclude) => {
  let i
  do { i = Math.floor(Math.random() * ZONES.length) } while (ZONES[i].id === exclude)
  return i
}

export default function OneButtonGame({ onGameOver }) {
  const canvasRef = useRef(null)

  // Mutable game state lives in refs (read/written inside the rAF loop + handlers).
  const angleRef = useRef(0)
  const targetRef = useRef(pickTarget(null))
  const scoreRef = useRef(0)
  const livesRef = useRef(START_LIVES)
  const flashRef = useRef(null)   // { type: 'hit'|'miss', until: timestamp }

  // Mirrored to React state only for the HUD.
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(START_LIVES)

  const draw = useCallback((flashType) => {
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

    const targetIdx = targetRef.current
    ZONES.forEach((zone, i) => {
      const isTarget = i === targetIdx
      ctx.beginPath()
      ctx.arc(CENTER, CENTER, RING_RADIUS, zone.start, zone.start + zone.size)
      ctx.strokeStyle = zone.color
      ctx.globalAlpha = isTarget ? 1 : 0.22
      ctx.lineWidth = isTarget ? RING_WIDTH + 8 : RING_WIDTH
      ctx.lineCap = 'butt'
      if (isTarget) { ctx.shadowColor = zone.color; ctx.shadowBlur = 18 }
      ctx.stroke()
      ctx.shadowBlur = 0
      ctx.globalAlpha = 1
    })

    // Target label in the center.
    const target = ZONES[targetIdx]
    ctx.fillStyle = flashType === 'miss' ? '#ff3b3b' : target.color
    ctx.font = '20px "Press Start 2P", monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(target.label, CENTER, CENTER - 12)
    ctx.fillStyle = '#666'
    ctx.font = '9px "Press Start 2P", monospace'
    ctx.fillText('TAP / SPACE', CENTER, CENTER + 18)

    // Marker.
    const a = angleRef.current
    const mx = CENTER + Math.cos(a) * RING_RADIUS
    const my = CENTER + Math.sin(a) * RING_RADIUS
    ctx.beginPath()
    ctx.arc(mx, my, 11, 0, TAU)
    ctx.fillStyle = flashType === 'hit' ? '#fff' : flashType === 'miss' ? '#ff3b3b' : '#fff'
    ctx.shadowColor = '#fff'
    ctx.shadowBlur = 12
    ctx.fill()
    ctx.shadowBlur = 0
  }, [])

  useGameLoop((delta) => {
    angleRef.current = (angleRef.current + speedForScore(scoreRef.current) * delta) % TAU
    const flash = flashRef.current
    const flashType = flash && performance.now() < flash.until ? flash.type : null
    draw(flashType)
  }, true)

  const press = useCallback(() => {
    const hit = angleInZone(angleRef.current, ZONES[targetRef.current])
    if (hit) {
      const gained = ZONES[targetRef.current].points
      scoreRef.current += gained
      setScore(scoreRef.current)
      flashRef.current = { type: 'hit', until: performance.now() + FLASH_MS }
      targetRef.current = pickTarget(ZONES[targetRef.current].id)
    } else {
      livesRef.current -= 1
      setLives(livesRef.current)
      flashRef.current = { type: 'miss', until: performance.now() + FLASH_MS }
      if (livesRef.current <= 0) {
        onGameOver(scoreRef.current)
      }
    }
  }, [onGameOver])

  // Input: spacebar (keyboard) + pointer (tap/click).
  useEffect(() => {
    const onKey = (e) => {
      if (e.code === 'Space' || e.key === ' ') { e.preventDefault(); press() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [press])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', width: FIELD,
        fontSize: 12, letterSpacing: 1,
      }}>
        <span style={{ color: '#ffe600' }}>SCORE {score}</span>
        <span style={{ color: '#ff4fd8' }}>{'♥'.repeat(lives)}{'·'.repeat(START_LIVES - lives)}</span>
      </div>
      <canvas
        ref={canvasRef}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        onPointerDown={(e) => { e.preventDefault(); press() }}
        style={{ cursor: 'pointer', touchAction: 'none', width: FIELD, height: FIELD, maxWidth: '100%' }}
      />
    </div>
  )
}
