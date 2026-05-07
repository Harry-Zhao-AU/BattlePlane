import { AttackResult, CellState, PlaneDefinition } from '@battleplane/shared';
import { computePlaneCells } from '@battleplane/shared';

export interface PlayerState {
  playerId: string;
  socketId: string;
  playerName: string;
  planes: PlaneDefinition[];
  occupiedCells: Set<string>;
  cockpitCells: Map<string, number>;
  boardReceived: CellState[][];
  planesAlive: number;
  ready: boolean;
  rematchReady: boolean;
}

export function resetPlayerForRematch(player: PlayerState): void {
  player.planes = [];
  player.occupiedCells = new Set();
  player.cockpitCells = new Map();
  player.boardReceived = buildInitialBoard();
  player.planesAlive = 3;
  player.ready = false;
  player.rematchReady = false;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  occupiedCells?: Set<string>;
  cockpitCells?: Map<string, number>;
}

export function buildInitialBoard(): CellState[][] {
  return Array.from({ length: 10 }, () =>
    Array.from({ length: 10 }, () => ({ attacked: false }))
  );
}

export function validatePlanes(planes: PlaneDefinition[]): ValidationResult {
  if (planes.length !== 3) {
    return { valid: false, error: 'Must place exactly 3 planes' };
  }

  const allCells: string[] = [];
  const cockpitCells = new Map<string, number>();

  for (let i = 0; i < planes.length; i++) {
    const { cells, cockpit } = computePlaneCells(planes[i]);
    for (const [r, c] of cells) {
      if (r < 0 || r > 9 || c < 0 || c > 9) {
        return { valid: false, error: `Plane ${i + 1} is out of bounds` };
      }
      allCells.push(`${r},${c}`);
    }
    cockpitCells.set(`${cockpit[0]},${cockpit[1]}`, i);
  }

  const cellSet = new Set(allCells);
  if (cellSet.size < 30) {
    return { valid: false, error: 'Planes overlap' };
  }

  return { valid: true, occupiedCells: cellSet, cockpitCells };
}

export function resolveAttack(
  defender: PlayerState,
  row: number,
  col: number
): AttackResult | 'already_attacked' {
  const key = `${row},${col}`;

  if (defender.boardReceived[row][col].attacked) {
    return 'already_attacked';
  }

  defender.boardReceived[row][col].attacked = true;

  if (defender.cockpitCells.has(key)) {
    defender.boardReceived[row][col].result = AttackResult.KILL;
    defender.planesAlive -= 1;
    return AttackResult.KILL;
  }

  if (defender.occupiedCells.has(key)) {
    defender.boardReceived[row][col].result = AttackResult.HIT;
    return AttackResult.HIT;
  }

  defender.boardReceived[row][col].result = AttackResult.MISS;
  return AttackResult.MISS;
}
