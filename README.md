# ONE BUTTON

A one-button arcade timing game. A marker orbits a circular ring of four colored
zones (JUMP / DUCK / BLOCK / PERFECT). One zone lights up as the target — press
**spacebar** or **tap** when the marker is over it. Miss and you lose one of your
3 lives. The marker speeds up as your score climbs.

Built with **React + Vite**, canvas rendering via `requestAnimationFrame`, retro
look from the *Press Start 2P* font.

## Run locally

```bash
npm install
npm run dev      # http://localhost:5173
```

## Build + deploy

```bash
npm run build    # outputs to dist/
vercel --prod    # deploy to Vercel
```

## Layout

```
src/
  constants/zones.js      ZONES array + tuning (speed, sizes, lives)
  hooks/useGameLoop.js    requestAnimationFrame loop hook
  components/
    OneButtonGame.jsx     canvas draw + input + game logic
    StartScreen.jsx       title / instructions
    GameOverScreen.jsx    score + best, retry
  App.jsx                 screen state machine
  main.jsx                React entry point
```

Tune difficulty in `src/constants/zones.js`: `BASE_SPEED`, `SPEED_PER_POINT`,
zone `size`/`points`, `START_LIVES`.
