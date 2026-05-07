# BattlePlane — Phase 1: Core Multiplayer Game

## Goal
Build a working 2-player online game: create room → share link → place planes → take turns attacking → winner declared. No bot, no fancy animations yet.

---

## Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Node.js + Express + Socket.io 4 + TypeScript
- **Shared types**: `/shared` workspace package
- **Client state**: Zustand
- **Styling**: Tailwind CSS v3 (dark ocean theme, basic)
- **No database** — all room/game state in server memory

---

## Directory Structure

```
BattlePlane/
├── package.json              # npm workspaces root (+ concurrently)
├── .gitignore
├── plan.md
├── shared/
│   ├── package.json
│   └── src/
│       ├── types.ts          # GamePhase, AttackResult, PlaneDefinition, CellState
│       ├── events.ts         # Socket.io event name constants
│       └── planeShapes.ts    # canonical offsets + rotation transforms
├── server/
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts          # Express + Socket.io entry, serves /client/dist in prod
│       ├── roomManager.ts    # in-memory room registry
│       ├── gameEngine.ts     # validatePlanes, resolveAttack (pure, no IO)
│       └── socketHandlers.ts # register all socket event handlers
└── client/
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts        # proxy /socket.io → :3001
    └── src/
        ├── main.tsx
        ├── App.tsx           # route between screens based on game phase
        ├── socket.ts         # singleton socket.io-client instance
        ├── store/
        │   └── gameStore.ts  # Zustand store
        ├── hooks/
        │   └── useSocket.ts  # register socket listeners, dispatch to store
        └── components/
            ├── LobbyScreen.tsx
            ├── PlacementScreen.tsx
            ├── BattleScreen.tsx
            ├── EndScreen.tsx
            ├── Board.tsx
            └── RoomLink.tsx
```

---

## Game Rules
- 10×10 board, 3 planes per player, each plane = 10 cells
- Plane shape offsets from cockpit (direction = UP):
  `[0,0],[1,0],[1,-1],[1,-2],[1,1],[1,2],[2,0],[3,0],[3,-1],[3,1]`
- Rotation transforms: UP=`[dr,dc]`, RIGHT=`[dc,-dr]`, DOWN=`[-dr,-dc]`, LEFT=`[-dc,dr]`
- Attack result: cockpit cell → KILL (头), other plane cell → HIT (伤), empty → MISS (空)
- Win condition: destroy all 3 enemy cockpits

---

## Socket.io Event Contract

### Client → Server
| Event | Payload |
|---|---|
| `room:create` | `{ playerName: string }` |
| `room:join` | `{ roomId: string, playerName: string }` |
| `placement:submit` | `{ planes: PlaneDefinition[] }` |
| `battle:attack` | `{ row: number, col: number }` |

### Server → Client
| Event | Payload |
|---|---|
| `room:created` | `{ roomId, playerId }` |
| `room:joined` | `{ roomId, playerId, opponentName }` |
| `room:opponent_joined` | `{ opponentName }` |
| `room:opponent_left` | `{}` |
| `game:phase_change` | `{ phase: GamePhase }` |
| `placement:ack` | `{ valid: boolean, error?: string }` |
| `game:both_ready` | `{ firstTurn: PlayerId }` |
| `battle:result` | `{ attackerId, row, col, result, nextTurn, gameOver?, winnerId? }` |
| `error` | `{ code: string, message: string }` |

---

## Game State Machine
```
WAITING  → PLACING   (2nd player joins)
PLACING  → BATTLING  (both submit valid placements)
BATTLING → ENDED     (3 cockpits destroyed)
any      → cleanup   (opponent disconnects → notify remaining player)
```

---

## Shared Types (`shared/src/types.ts`)
```ts
export type PlayerId = string;
export type RoomId = string;

export enum GamePhase { WAITING = 'waiting', PLACING = 'placing', BATTLING = 'battling', ENDED = 'ended' }
export enum AttackResult { MISS = 'miss', HIT = 'hit', KILL = 'kill' }

export interface PlaneDefinition {
  cockpitRow: number;
  cockpitCol: number;
  direction: 'up' | 'down' | 'left' | 'right';
}
export interface CellState { attacked: boolean; result?: AttackResult }
```

---

## Server Logic

### `gameEngine.ts` (pure functions)
- `computePlaneCells(plane)` → apply rotation offsets, return 10 absolute cells + cockpit key
- `validatePlanes(planes[])` → bounds-check all 30 cells, overlap-check via Set (size must equal 30)
- `resolveAttack(defender, row, col)` → KILL / HIT / MISS

### `roomManager.ts`
- `rooms: Map<RoomId, RoomState>` — module-level singleton
- `createRoom(socketId, playerName)` — nanoid(6) room ID, phase = WAITING
- `joinRoom(roomId, socketId, playerName)` — validates not full, sets phase = PLACING
- `submitPlacement(roomId, playerId, planes)` — validates, stores cells, checks if both ready
- `processAttack(roomId, attackerId, row, col)` — validates turn, resolves, toggles turn
- `removePlayer(socketId)` — cleans up on disconnect

### `PlayerState` shape
```ts
{
  playerId: string, socketId: string, playerName: string,
  occupiedCells: Set<string>,       // "row,col" for O(1) lookup
  cockpitCells: Map<string, number>, // "row,col" → planeIndex
  planesAlive: number,              // starts at 3
  ready: boolean,
}
```

---

## Client Store (`gameStore.ts` — Zustand)
```ts
{
  roomId: string | null,
  playerId: string | null,
  phase: GamePhase | null,
  myPlanes: PlaneDefinition[],
  myBoard: CellState[][],     // attacks received on me (10×10)
  enemyBoard: CellState[][],  // my attacks on enemy (10×10)
  isMyTurn: boolean,
  opponentName: string | null,
  winnerId: string | null,
}
```

---

## Basic UI (Phase 1 — functional, not polished)
- Dark background (`bg-slate-900`), white text
- **LobbyScreen**: "Create Room" button; after create shows copyable room URL and spinner
  - Auto-joins if `roomId` found in URL on mount
- **PlacementScreen**: Board with click-to-place, R key to rotate, plane ghost preview on hover; "Ready" button
- **BattleScreen**: Two boards side-by-side; "YOUR FLEET" (left, readonly) and "ENEMY WATERS" (right, clickable on your turn); whose-turn label
- **EndScreen**: Winner announcement, "Play Again" button
- **Board.tsx**: generic 10×10 grid; cells colored by state (miss=blue-200, hit=orange-400, kill=red-500)

> Phase 2 will add polished dark-ocean theme, animations, responsive layout, and the bloob.io-inspired visual style.

---

## Build & Run
```bash
npm install
npm run build -w shared      # build shared types first
npm run dev                  # server :3001 + client :5173 (concurrently)
```

Root `package.json` scripts:
```json
{
  "dev":   "concurrently \"npm run dev -w server\" \"npm run dev -w client\"",
  "build": "npm run build -w shared && npm run build -w server && npm run build -w client",
  "start": "npm run start -w server"
}
```

---

## Implementation Order
1. `/shared` — types, event constants, plane offsets + rotation
2. `/server/src/gameEngine.ts` — pure logic (validate + resolve)
3. `/server/src/roomManager.ts` — stateful room map
4. `/server/src/index.ts` + `socketHandlers.ts` — wire Socket.io
5. `/client/src/socket.ts` + `store/gameStore.ts` + `hooks/useSocket.ts`
6. Client screens: Lobby → Board → Placement → Battle → End
7. End-to-end test in two browser tabs

---

## Verification
1. Tab A: open `localhost:5173` → Create Room → copy link
2. Tab B: open link → both see placement screen
3. Both place 3 planes + click Ready → battle screen
4. Alternate attacks → markers appear on both boards
5. Destroy all 3 cockpits → End screen shows winner
6. Close Tab B mid-game → Tab A shows "opponent left"

---

## Phases Roadmap
- **Phase 1** (this doc): Core multiplayer game ✓
- **Phase 2**: Polished UI — dark ocean theme, Framer Motion animations, responsive layout, bloob.io-inspired visuals
- **Phase 3**: Bot opponent — single-player mode with AI (random + heuristic attack strategy)
