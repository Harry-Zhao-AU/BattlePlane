import { create } from 'zustand';
import { CellState, GamePhase, PlaneDefinition } from '@battleplane/shared';

function emptyBoard(): CellState[][] {
  return Array.from({ length: 10 }, () =>
    Array.from({ length: 10 }, () => ({ attacked: false }))
  );
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
  reset: () => void;
}

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

  reset: () => set({
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
  }),
}));
