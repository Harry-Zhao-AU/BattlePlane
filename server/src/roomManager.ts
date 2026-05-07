import { nanoid } from 'nanoid';
import { GamePhase, PlaneDefinition, RoomId, PlayerId } from '@battleplane/shared';
import {
  PlayerState,
  ValidationResult,
  buildInitialBoard,
  validatePlanes,
  resolveAttack,
  resetPlayerForRematch,
} from './gameEngine';
import { AttackResult, computePlaneCells } from '@battleplane/shared';

export interface RoomState {
  roomId: RoomId;
  phase: GamePhase;
  players: [PlayerState | null, PlayerState | null];
  currentTurn: PlayerId | null;
  createdAt: number;
}

const rooms = new Map<RoomId, RoomState>();

function makePlayer(socketId: string, playerName: string): PlayerState {
  return {
    playerId: socketId,
    socketId,
    playerName,
    planes: [],
    occupiedCells: new Set(),
    cockpitCells: new Map(),
    boardReceived: buildInitialBoard(),
    planesAlive: 3,
    ready: false,
    rematchReady: false,
  };
}

export function createRoom(socketId: string, playerName: string): RoomState {
  const roomId = nanoid(6);
  const room: RoomState = {
    roomId,
    phase: GamePhase.WAITING,
    players: [makePlayer(socketId, playerName), null],
    currentTurn: null,
    createdAt: Date.now(),
  };
  rooms.set(roomId, room);
  return room;
}

export function joinRoom(
  roomId: RoomId,
  socketId: string,
  playerName: string
): RoomState | { error: string } {
  const room = rooms.get(roomId);
  if (!room) return { error: 'Room not found' };
  if (room.phase !== GamePhase.WAITING) return { error: 'Room is not accepting players' };
  if (room.players[1] !== null) return { error: 'Room is full' };

  room.players[1] = makePlayer(socketId, playerName);
  room.phase = GamePhase.PLACING;
  return room;
}

export function getRoom(roomId: RoomId): RoomState | undefined {
  return rooms.get(roomId);
}

export function findRoomBySocketId(socketId: string): RoomState | undefined {
  for (const room of rooms.values()) {
    if (room.players.some(p => p?.socketId === socketId)) return room;
  }
  return undefined;
}

export function getPlayerInRoom(room: RoomState, socketId: string): PlayerState | null {
  return room.players.find(p => p?.socketId === socketId) ?? null;
}

export function getOpponent(room: RoomState, socketId: string): PlayerState | null {
  return room.players.find(p => p !== null && p.socketId !== socketId) ?? null;
}

export function submitPlacement(
  roomId: RoomId,
  playerId: PlayerId,
  planes: PlaneDefinition[]
): { valid: boolean; error?: string; bothReady?: boolean } {
  const room = rooms.get(roomId);
  if (!room || room.phase !== GamePhase.PLACING) return { valid: false, error: 'Invalid room state' };

  const player = getPlayerInRoom(room, playerId);
  if (!player) return { valid: false, error: 'Player not in room' };
  if (player.ready) return { valid: false, error: 'Already submitted' };

  const result: ValidationResult = validatePlanes(planes);
  if (!result.valid) return { valid: false, error: result.error };

  player.planes = planes;
  player.occupiedCells = result.occupiedCells!;
  player.cockpitCells = result.cockpitCells!;
  player.ready = true;

  const bothReady = room.players.every(p => p?.ready === true);
  if (bothReady) {
    room.phase = GamePhase.BATTLING;
    room.currentTurn = room.players[Math.floor(Math.random() * 2)]!.playerId;
  }

  return { valid: true, bothReady };
}

export interface AttackOutcome {
  result: AttackResult;
  gameOver: boolean;
  winnerId?: PlayerId;
  nextTurn: PlayerId;
  planeCells?: [number, number][];
}

export function processAttack(
  roomId: RoomId,
  attackerId: PlayerId,
  row: number,
  col: number
): AttackOutcome | { error: string } {
  const room = rooms.get(roomId);
  if (!room || room.phase !== GamePhase.BATTLING) return { error: 'Not in battle phase' };
  if (room.currentTurn !== attackerId) return { error: 'Not your turn' };

  const attacker = getPlayerInRoom(room, attackerId);
  const defender = getOpponent(room, attackerId);
  if (!attacker || !defender) return { error: 'Players not found' };

  const result = resolveAttack(defender, row, col);
  if (result === 'already_attacked') return { error: 'Cell already attacked' };

  let planeCells: [number, number][] | undefined;
  if (result === AttackResult.KILL) {
    const planeIndex = defender.cockpitCells.get(`${row},${col}`);
    if (planeIndex !== undefined) {
      planeCells = computePlaneCells(defender.planes[planeIndex]).cells;
    }
  }

  const gameOver = defender.planesAlive === 0;
  if (gameOver) {
    room.phase = GamePhase.ENDED;
    return { result, gameOver: true, winnerId: attackerId, nextTurn: attackerId, planeCells };
  }

  room.currentTurn = defender.playerId;
  return { result, gameOver: false, nextTurn: defender.playerId, planeCells };
}

export function requestRematch(
  roomId: RoomId,
  playerId: PlayerId
): { bothReady: boolean } | { error: string } {
  const room = rooms.get(roomId);
  if (!room || room.phase !== GamePhase.ENDED) return { error: 'Game not ended' };

  const player = getPlayerInRoom(room, playerId);
  if (!player) return { error: 'Player not in room' };

  player.rematchReady = true;
  const bothReady = room.players.every(p => p?.rematchReady === true);

  if (bothReady) {
    room.players.forEach(p => p && resetPlayerForRematch(p));
    room.phase = GamePhase.PLACING;
    room.currentTurn = null;
  }

  return { bothReady };
}

export function removePlayer(socketId: string): { room: RoomState; opponent: PlayerState | null } | null {
  const room = findRoomBySocketId(socketId);
  if (!room) return null;

  const opponent = getOpponent(room, socketId);

  if (!opponent) {
    rooms.delete(room.roomId);
  } else {
    const idx = room.players.findIndex(p => p?.socketId === socketId);
    if (idx !== -1) room.players[idx] = null;
    room.phase = GamePhase.WAITING;
    room.currentTurn = null;
  }

  return { room, opponent };
}
