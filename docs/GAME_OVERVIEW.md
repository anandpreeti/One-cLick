# One Button Game — Code Overview

A walkthrough of `src/components/OneButtonGame.jsx`, written for a React dev who
isn't a game dev. Companion files: `src/hooks/useGameLoop.js` and
`src/constants/zones.js`.

## The core mental model

A game is just an **infinite loop that redraws the screen ~60 times a second**,
plus some state that changes between frames. Everything in this component is
React plumbing wrapped around that one idea.

## The game itself

A colored ring made of 4 arcs: **JUMP, DUCK, BLOCK, PERFECT**. A dot ("marker")
travels around the ring continuously. One arc is highlighted as the **target**.
You tap / press space when the dot is passing through the highlighted arc.

- Hit → points (PERFECT is worth 3, the rest 1 each), pick a new target.
- Miss → lose a life.
- Speed ramps up as your score rises.
- Three misses → game over.

---

## The one thing to internalize

> **Refs are the game's live memory** (mutated 60×/sec, never trigger renders).
> **State is only for the HUD.** `draw` paints to canvas imperatively instead of
> through JSX.

That split is the whole reason this looks different from a normal React
component. Once it clicks, the rest is just trigonometry and a
`requestAnimationFrame` loop.

---

## Section 1 — Imports & module constants (lines 1–14)

```js
const TAU = Math.PI * 2          // one full circle in radians
const CENTER = CANVAS_SIZE / 2   // middle of the canvas
const pickTarget = (exclude) => { ... }
```

- `TAU` = "360 degrees" in radians. All canvas drawing math uses radians.
- `pickTarget` randomly picks the index of the next target arc. The `do/while`
  re-rolls if it landed on the same one you just had (`exclude`), so you never
  get the same target twice in a row.

Pure helpers, no React here.

## Section 2 — Refs vs. state, the key architectural choice (lines 16–28)

```js
const angleRef  = useRef(0)               // where the dot is on the ring
const targetRef = useRef(pickTarget(null))
const scoreRef  = useRef(0)
const livesRef  = useRef(START_LIVES)
const flashRef  = useRef(null)

const [score, setScore] = useState(0)     // same score, but as state
const [lives, setLives] = useState(START_LIVES)
```

`score` and `lives` exist **twice** — once as a ref, once as state. Deliberate.

**The rule:** anything the 60fps loop reads/writes lives in a **ref**; anything
React needs to render lives in **state**.

Why not just use state for everything? The loop updates the dot's angle every
~16ms. If `angle` were state, you'd call `setState` 60×/sec → 60 re-renders/sec.
Refs let you mutate values (`angleRef.current = ...`) **without** triggering a
render — exactly what you want for fast-changing game data drawn manually to a
canvas rather than through JSX.

So `score`/`lives` are **mirrored**: the ref is the source of truth the loop
uses, and `setScore`/`setLives` are called only when the HUD text actually needs
to update (on a hit or miss), not every frame.

`flashRef` holds `{ type: 'hit'|'miss', until: timestamp }` — a "flash this color
until time X" record for visual feedback.

## Section 3 — `draw`: rendering, but not React rendering (lines 30–72)

The game-dev part. Instead of returning JSX, this paints onto an HTML `<canvas>`
using the 2D context (`ctx`). Think of `ctx` as a pen you issue commands to:
clear the screen, draw an arc, set a color, stroke it.

- **Lines 33–48:** Clear the canvas, then loop the 4 zones and draw each as an
  arc (`ctx.arc`). The target is brighter (`globalAlpha = 1`), thicker, and has a
  glow (`shadowBlur`); the others are dimmed to `0.22` alpha. Settings are reset
  each iteration because the canvas context is **stateful** — settings persist
  until you change them back, unlike CSS.
- **Lines 50–59:** Draw the target's label (e.g. "PERFECT") in the center, plus a
  "TAP / SPACE" hint. On a miss, the label flashes red.
- **Lines 61–71:** Draw the moving dot. `cos`/`sin` convert the angle into x/y
  coordinates on the ring (`RING_RADIUS` away from center). Standard "place a
  point on a circle" trick: angle in, position out.

`draw` reads everything from refs. Wrapped in `useCallback([])` with no deps
because it never needs to change — it always reads current values from the refs.

## Section 4 — The game loop (lines 74–79)

```js
useGameLoop((delta) => {
  angleRef.current = (angleRef.current + speedForScore(scoreRef.current) * delta) % TAU
  const flash = flashRef.current
  const flashType = flash && performance.now() < flash.until ? flash.type : null
  draw(flashType)
}, true)
```

`useGameLoop` is a thin wrapper around `requestAnimationFrame` — the browser API
that calls your function right before each repaint (~60fps). It hands your
callback a `delta`: the seconds elapsed since the last frame.

`delta` makes motion **frame-rate independent**. Instead of "move 2px per frame"
(faster on a 120Hz monitor), you do "move `speed * delta`" — speed is in radians
*per second*, multiplied by how much real time passed. The hook also clamps delta
to `0.05` so switching tabs and returning doesn't teleport the dot from one giant
time gap.

Each frame: advance the angle by speed×time (wrapped with `% TAU`), check if a
flash is still active, redraw. `speedForScore` ramps speed with score (capped at
`MAX_SPEED`) — that's the difficulty curve.

## Section 5 — `press`: the one and only game action (lines 81–97)

```js
const press = useCallback(() => {
  const hit = angleInZone(angleRef.current, ZONES[targetRef.current])
  if (hit) { /* gain points, flash hit, pick new target */ }
  else     { /* lose a life, flash miss, maybe game over */ }
}, [onGameOver])
```

The "one button" of One Button Game. On a press, check whether the dot's current
angle is inside the target arc (`angleInZone` handles the wrap-around case where
an arc straddles the 0°/360° seam).

- **Hit:** add the zone's points to `scoreRef`, *also* `setScore` for the HUD,
  set a "hit" flash, pick a fresh target.
- **Miss:** decrement `livesRef`, `setLives` for the HUD, set a "miss" flash, and
  if lives hit zero call `onGameOver(score)` — the prop that lets the parent
  switch to a game-over screen.

Note the dual write again: `scoreRef.current += gained` (for the loop) and
`setScore(...)` (for the HUD) side by side.

## Section 6 — Input wiring (lines 99–106, plus 121)

Two input sources, both funneling into the same `press`:

```js
useEffect(() => {
  const onKey = (e) => { if (e.code === 'Space' ...) { e.preventDefault(); press() } }
  window.addEventListener('keydown', onKey)
  return () => window.removeEventListener('keydown', onKey)
}, [press])
```

- Spacebar → a global `window` listener (registered/cleaned up in an effect).
- Tap/click → inline `onPointerDown` on the canvas (line 121).

`preventDefault` stops the spacebar from scrolling and the pointer from default
touch behavior. Because `press` is memoized with `useCallback`, the effect
doesn't re-bind the listener on every render.

## Section 7 — The JSX (lines 108–126)

Small, because the game visuals are all on the canvas. It returns:

1. **HUD row** — `SCORE {score}` and a hearts display. The hearts use a trick:
   `'♥'.repeat(lives)` filled hearts plus `'·'.repeat(START_LIVES - lives)` dots
   for lost lives. This is the **only** place `score`/`lives` state is consumed —
   confirming why those two needed to be state and not just refs.
2. The **`<canvas>`** — with the `canvasRef`, fixed pixel size, the pointer
   handler, and `touchAction: 'none'` so mobile doesn't scroll/zoom on tap.

---

## Reference: config & zones (`src/constants/zones.js`)

| Constant | Value | Meaning |
|---|---|---|
| `CANVAS_SIZE` | 420 | px, square canvas |
| `RING_RADIUS` | 150 | px, radius of the marker's track |
| `RING_WIDTH` | 26 | px, ring thickness |
| `BASE_SPEED` | 2.2 | radians/sec at score 0 |
| `SPEED_PER_POINT` | 0.12 | speed added per point scored |
| `MAX_SPEED` | 9 | hard speed cap |
| `FLASH_MS` | 220 | hit/miss flash duration (ms) |
| `START_LIVES` | 3 | starting lives |

Zones (each an arc measured in radians; `start` = starting angle, `size` = arc
length; 0 = 3 o'clock, clockwise positive):

| id | color | points | notes |
|---|---|---|---|
| JUMP | green | 1 | |
| DUCK | blue | 1 | |
| BLOCK | pink | 1 | |
| PERFECT | yellow | 3 | smaller arc, worth more |

Key functions:

- `speedForScore(score)` → `min(MAX_SPEED, BASE_SPEED + score * SPEED_PER_POINT)`
- `angleInZone(angle, zone)` → normalizes the angle to `0..TAU` and checks if it
  falls within the zone's arc, with a special branch for arcs that wrap past the
  0°/360° seam.

## Reference: the loop hook (`src/hooks/useGameLoop.js`)

```js
export function useGameLoop(callback, active) {
  const cbRef = useRef(callback)
  cbRef.current = callback           // always call the latest callback

  useEffect(() => {
    if (!active) return
    let raf, last = null
    const tick = (now) => {
      if (last == null) last = now
      const delta = Math.min((now - last) / 1000, 0.05)  // clamp big gaps
      last = now
      cbRef.current(delta)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [active])
}
```

Runs `callback(deltaSeconds)` every animation frame while `active` is true. The
`cbRef` indirection means it always calls the latest closure without restarting
the rAF loop on every render. Delta is clamped to `0.05s` so a backgrounded tab
doesn't produce a huge jump on resume.
