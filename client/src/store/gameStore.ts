import { create } from 'zustand';
import { AttackResult, CellState, GamePhase, PlaneDefinition } from '@battleplane/shared';

function emptyBoard(): CellState[][] {
  return Array.from({ length: 10 }, () =>
    Array.from({ length: 10 }, () => ({ attacked: false }))
  );
}

export interface LastAttack {
  row: number;
  col: number;
  result: AttackResult;
  key: number;
}

interface GameStore {
  roomId: string | null;
  playerId: string | null;
  phase: GamePhase | null;
  myName: string;
  opponentName: string | null;
  myPlanes: PlaneDefinition[];
  myBoard: CellState[][];
  enemyBoard: CellState[][];
  isMyTurn: boolean;
  winnerId: string | null;
  errorMsg: string | null;
  revealedEnemyCells: Set<string>;
  lastAttack: LastAttack | null;

  setRoomId: (id: string) => void;
  setPlayerId: (id: string) => void;
  setPhase: (phase: GamePhase) => void;
  setMyName: (name: string) => void;
  setOpponentName: (name: string) => void;
  setMyPlanes: (planes: PlaneDefinition[]) => void;
  setIsMyTurn: (v: boolean) => void;
  updateMyBoard: (row: number, col: number, cell: CellState) => void;
  updateEnemyBoard: (row: number, col: number, cell: CellState) => void;
  setWinnerId: (id: string) => void;
  setErrorMsg: (msg: string | null) => void;
  revealEnemyPlane: (cells: [number, number][]) => void;
  setLastAttack: (v: LastAttack) => void;
  resetForRematch: () => void;
  reset: () => void;
}

let attackCounter = 0;

export const useGameStore = create<GameStore>((set, get) => ({
  roomId: null,
  playerId: null,
  phase: null,
  myName: '',
  opponentName: null,
  myPlanes: [],
  myBoard: emptyBoard(),
  enemyBoard: emptyBoard(),
  isMyTurn: false,
  winnerId: null,
  errorMsg: null,
  revealedEnemyCells: new Set(),
  lastAttack: null,

  setRoomId: (id) => set({ roomId: id }),
  setPlayerId: (id) => set({ playerId: id }),
  setPhase: (phase) => set({ phase }),
  setMyName: (name) => set({ myName: name }),
  setOpponentName: (name) => set({ opponentName: name }),
  setMyPlanes: (planes) => set({ myPlanes: planes }),
  setIsMyTurn: (v) => set({ isMyTurn: v }),

  updateMyBoard: (row, col, cell) => {
    const board = get().myBoard.map(r => [...r]);
    board[row][col] = cell;
    set({ myBoard: board });
  },

  updateEnemyBoard: (row, col, cell) => {
    const board = get().enemyBoard.map(r => [...r]);
    board[row][col] = cell;
    set({ enemyBoard: board });
  },

  setWinnerId: (id) => set({ winnerId: id }),
  setErrorMsg: (msg) => set({ errorMsg: msg }),

  revealEnemyPlane: (cells) => {
    const prev = get().revealedEnemyCells;
    const next = new Set(prev);
    cells.forEach(([r, c]) => next.add(`${r},${c}`));
    set({ revealedEnemyCells: next });
  },

  setLastAttack: (v) => set({ lastAttack: v }),

  resetForRematch: () => {
    attackCounter = 0;
    set({
      myPlanes: [],
      myBoard: emptyBoard(),
      enemyBoard: emptyBoard(),
      isMyTurn: false,
      winnerId: null,
      errorMsg: null,
      revealedEnemyCells: new Set(),
      lastAttack: null,
    });
  },

  reset: () => {
    attackCounter = 0;
    set({
      roomId: null,
      playerId: null,
      phase: null,
      opponentName: null,
      myPlanes: [],
      myBoard: emptyBoard(),
      enemyBoard: emptyBoard(),
      isMyTurn: false,
      winnerId: null,
      errorMsg: null,
      revealedEnemyCells: new Set(),
      lastAttack: null,
    });
  },
}));

export function nextAttackKey(): number {
  return ++attackCounter;
}
