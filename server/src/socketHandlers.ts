import { Server, Socket } from 'socket.io';
import { EVENTS, GamePhase, PlaneDefinition } from '@battleplane/shared';
import * as rm from './roomManager';

export function registerSocketHandlers(io: Server): void {
  io.on('connection', (socket: Socket) => {
    socket.on(EVENTS.ROOM_CREATE, ({ playerName }: { playerName: string }) => {
      const room = rm.createRoom(socket.id, playerName);
      socket.join(room.roomId);
      socket.emit(EVENTS.ROOM_CREATED, { roomId: room.roomId, playerId: socket.id });
    });

    socket.on(EVENTS.ROOM_JOIN, ({ roomId, playerName }: { roomId: string; playerName: string }) => {
      const result = rm.joinRoom(roomId, socket.id, playerName);
      if ('error' in result) {
        socket.emit(EVENTS.ERROR, { code: 'JOIN_FAILED', message: result.error });
        return;
      }
      socket.join(roomId);
      const creator = result.players[0]!;
      socket.emit(EVENTS.ROOM_JOINED, {
        roomId,
        playerId: socket.id,
        opponentName: creator.playerName,
      });
      socket.to(roomId).emit(EVENTS.ROOM_OPPONENT_JOINED, { opponentName: playerName });
      io.to(roomId).emit(EVENTS.GAME_PHASE_CHANGE, { phase: GamePhase.PLACING });
    });

    socket.on(EVENTS.PLACEMENT_SUBMIT, ({ planes }: { planes: PlaneDefinition[] }) => {
      const room = rm.findRoomBySocketId(socket.id);
      if (!room) {
        socket.emit(EVENTS.ERROR, { code: 'NO_ROOM', message: 'Not in a room' });
        return;
      }
      const outcome = rm.submitPlacement(room.roomId, socket.id, planes);
      if (!outcome.valid) {
        socket.emit(EVENTS.PLACEMENT_ACK, { valid: false, error: outcome.error });
        return;
      }
      socket.emit(EVENTS.PLACEMENT_ACK, { valid: true });
      if (outcome.bothReady) {
        const updatedRoom = rm.getRoom(room.roomId)!;
        io.to(room.roomId).emit(EVENTS.GAME_BOTH_READY, { firstTurn: updatedRoom.currentTurn });
        io.to(room.roomId).emit(EVENTS.GAME_PHASE_CHANGE, { phase: GamePhase.BATTLING });
      }
    });

    socket.on(EVENTS.BATTLE_ATTACK, ({ row, col }: { row: number; col: number }) => {
      const room = rm.findRoomBySocketId(socket.id);
      if (!room) {
        socket.emit(EVENTS.ERROR, { code: 'NO_ROOM', message: 'Not in a room' });
        return;
      }
      const outcome = rm.processAttack(room.roomId, socket.id, row, col);
      if ('error' in outcome) {
        socket.emit(EVENTS.ERROR, { code: 'ATTACK_FAILED', message: outcome.error });
        return;
      }
      io.to(room.roomId).emit(EVENTS.BATTLE_RESULT, {
        attackerId: socket.id,
        row,
        col,
        result: outcome.result,
        nextTurn: outcome.nextTurn,
        gameOver: outcome.gameOver,
        winnerId: outcome.winnerId,
      });
      if (outcome.gameOver) {
        io.to(room.roomId).emit(EVENTS.GAME_PHASE_CHANGE, { phase: GamePhase.ENDED });
      }
    });

    socket.on('disconnect', () => {
      const result = rm.removePlayer(socket.id);
      if (result?.opponent) {
        io.to(result.room.roomId).emit(EVENTS.ROOM_OPPONENT_LEFT, {});
      }
    });
  });
}
