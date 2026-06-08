import { useState } from 'react'
import StartScreen from './components/StartScreen.jsx'
import OneButtonGame from './components/OneButtonGame.jsx'
import GameOverScreen from './components/GameOverScreen.jsx'

// Three screens, one piece of state to switch between them.
export default function App() {
  const [screen, setScreen] = useState('start')   // 'start' | 'playing' | 'over'
  const [score, setScore] = useState(0)
  const [best, setBest] = useState(() => Number(localStorage.getItem('onebutton.best')) || 0)

  const start = () => { setScore(0); setScreen('playing') }

  const gameOver = (finalScore) => {
    setScore(finalScore)
    if (finalScore > best) {
      setBest(finalScore)
      localStorage.setItem('onebutton.best', String(finalScore))
    }
    setScreen('over')
  }

  return (
    <>
      {screen === 'start' && <StartScreen onStart={start} />}
      {/* key forces a fresh game instance each play, resetting all internal refs */}
      {screen === 'playing' && <OneButtonGame key={Date.now()} onGameOver={gameOver} />}
      {screen === 'over' && <GameOverScreen score={score} best={best} onRestart={start} />}
    </>
  )
}
