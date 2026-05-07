import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { EVENTS, GamePhase, AttackResult } from '@battleplane/shared';
import socket from '../socket';
import { useGameStore } from '../store/gameStore';

export function useSocket() {
  const store = useGameStore();
  const navigate = useNavigate();

  useEffect(() => {
    socket.on(EVENTS.ROOM_CREATED, ({ roomId, playerId }: { roomId: string; playerId: string }) => {
      useGameStore.getState().setRoomId(roomId);
      useGameStore.getState().setPlayerId(playerId);
      useGameStore.getState().setPhase(GamePhase.WAITING);
      navigate(`/room/${roomId}`);
    });

    socket.on(EVENTS.ROOM_JOINED, ({ roomId, playerId, opponentName }: { roomId: string; playerId: string; opponentName: string }) => {
      useGameStore.getState().setRoomId(roomId);
      useGameStore.getState().setPlayerId(playerId);
      useGameStore.getState().setOpponentName(opponentName);
    });

    socket.on(EVENTS.ROOM_OPPONENT_JOINED, ({ opponentName }: { opponentName: string }) => {
      useGameStore.getState().setOpponentName(opponentName);
    });

    socket.on(EVENTS.ROOM_OPPONENT_LEFT, () => {
      useGameStore.getState().setErrorMsg('Opponent left the game.');
      useGameStore.getState().setPhase(GamePhase.WAITING);
    });

    socket.on(EVENTS.GAME_PHASE_CHANGE, ({ phase }: { phase: GamePhase }) => {
      useGameStore.getState().setPhase(phase);
    });

    socket.on(EVENTS.PLACEMENT_ACK, ({ valid, error }: { valid: boolean; error?: string }) => {
      if (!valid) useGameStore.getState().setErrorMsg(error ?? 'Invalid placement');
    });

    socket.on(EVENTS.GAME_BOTH_READY, ({ firstTurn }: { firstTurn: string }) => {
      const { playerId } = useGameStore.getState();
      useGameStore.getState().setIsMyTurn(firstTurn === playerId);
    });

    socket.on(EVENTS.BATTLE_RESULT, ({
      attackerId, row, col, result, nextTurn, gameOver, winnerId,
    }: {
      attackerId: string;
      row: number;
      col: number;
      result: AttackResult;
      nextTurn: string;
      gameOver?: boolean;
      winnerId?: string;
    }) => {
      const { playerId, updateEnemyBoard, updateMyBoard, setIsMyTurn, setWinnerId } = useGameStore.getState();
      const cell = { attacked: true, result };

      if (attackerId === playerId) {
        updateEnemyBoard(row, col, cell);
      } else {
        updateMyBoard(row, col, cell);
      }

      setIsMyTurn(nextTurn === playerId);

      if (gameOver && winnerId) {
        setWinnerId(winnerId);
      }
    });

    socket.on(EVENTS.ERROR, ({ message }: { message: string }) => {
      useGameStore.getState().setErrorMsg(message);
    });

    return () => {
      socket.off(EVENTS.ROOM_CREATED);
      socket.off(EVENTS.ROOM_JOINED);
      socket.off(EVENTS.ROOM_OPPONENT_JOINED);
      socket.off(EVENTS.ROOM_OPPONENT_LEFT);
      socket.off(EVENTS.GAME_PHASE_CHANGE);
      socket.off(EVENTS.PLACEMENT_ACK);
      socket.off(EVENTS.GAME_BOTH_READY);
      socket.off(EVENTS.BATTLE_RESULT);
      socket.off(EVENTS.ERROR);
    };
  }, []);
}
