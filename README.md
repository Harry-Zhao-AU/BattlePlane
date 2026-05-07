# BattlePlane (炸飞机)

A real-time 2-player online game based on the Chinese board game 炸飞机. Create a room, share the link, place your planes, and take turns bombing the enemy.

## How to Play

1. Player A opens the site and clicks **Create Room** — a shareable link appears.
2. Player B opens the link and enters their name.
3. Both players place **3 planes** on their 10×10 grid, then click **Ready**.
4. Take turns selecting a coordinate to attack. The result is:
   - **○ Miss** (空) — empty cell
   - **✕ Hit** (伤) — plane body struck
   - **✕ Cockpit** (头) — cockpit destroyed, plane eliminated
5. First player to destroy all 3 enemy cockpits wins.

### Plane Shape

Each plane occupies 10 cells. The cockpit (cyan) is the critical cell — destroy it to eliminate the plane.

```
. . ✈ . .   ← cockpit
. W B W .
W W B W W   ← wings span row
. . B . .
. T B T .   ← tail
```

Press **R** (or use the direction buttons) to rotate the plane before placing.

## Development

### Prerequisites

- Node.js 18+
- npm 9+

### Install

```bash
npm install
```

### Run (dev mode)

```bash
npm run dev
```

- Client: http://localhost:5173
- Server: http://localhost:3001

### Build for production

```bash
npm run build
npm start
```

The server will serve the built client at http://localhost:3001.

## Project Structure

```
BattlePlane/
├── shared/       # Shared TypeScript types, socket event constants, plane geometry
├── server/       # Node.js + Express + Socket.io — game logic, room management
└── client/       # React + Vite + Tailwind — all UI screens
```

## Roadmap

- **Phase 2** — Polished UI: dark ocean theme, animations, mobile layout
- **Phase 3** — Bot opponent for single-player mode
