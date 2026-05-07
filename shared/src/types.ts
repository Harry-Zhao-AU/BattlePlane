export type PlayerId = string;
export type RoomId = string;

export enum GamePhase {
  WAITING = 'waiting',
  PLACING = 'placing',
  BATTLING = 'battling',
  ENDED = 'ended',
}

export enum AttackResult {
  MISS = 'miss',
  HIT = 'hit',
  KILL = 'kill',
}

export interface PlaneDefinition {
  cockpitRow: number;
  cockpitCol: number;
  direction: 'up' | 'down' | 'left' | 'right';
}

export interface CellState {
  attacked: boolean;
  result?: AttackResult;
}
