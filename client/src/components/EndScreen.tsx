import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { EVENTS } from '@battleplane/shared';
import socket from '../socket';
import { useNavigate } from 'react-router-dom';

export default function EndScreen() {
  const store = useGameStore();
  const navigate = useNavigate();
  const iWon = store.winnerId === store.playerId;
  const [waiting, setWaiting] = useState(false);
  const [opponentWants, setOpponentWants] = useState(false);

  useEffect(() => {
    socket.on(EVENTS.ROOM_REMATCH_WAITING, ({ opponentWantsRematch }: { opponentWantsRematch?: boolean } = {}) => {
      if (opponentWantsRematch) setOpponentWants(true);
    });
    return () => { socket.off(EVENTS.ROOM_REMATCH_WAITING); };
  }, []);

  const handleContinue = () => {
    setWaiting(true);
    socket.emit(EVENTS.ROOM_REMATCH);
  };

  const handleLeave = () => {
    store.reset();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-10 w-full max-w-sm text-center shadow-xl">
        <div className={`text-7xl mb-4 inline-block ${iWon ? 'animate-enter-win' : 'animate-enter-lose'}`}>
          {iWon ? '🏆' : '💀'}
        </div>
        <h2 className={`text-3xl font-bold mb-2 ${iWon ? 'text-cyan-400' : 'text-slate-400'}`}>
          {iWon ? 'You Win!' : 'You Lose'}
        </h2>
        <p className="text-slate-400 mb-6 text-sm">
          {iWon
            ? 'All enemy planes destroyed!'
            : `${store.opponentName ?? 'Opponent'} destroyed all your planes.`}
        </p>

        {opponentWants && !waiting && (
          <p className="text-cyan-300 text-sm mb-3 animate-pulse">
            {store.opponentName ?? 'Opponent'} wants to play again!
          </p>
        )}

        {waiting ? (
          <div className="flex items-center justify-center gap-2 text-slate-400 text-sm mb-4">
            <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse inline-block" />
            Waiting for opponent...
          </div>
        ) : (
          <button
            onClick={handleContinue}
            className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold py-3 rounded-xl text-lg transition-colors mb-3"
          >
            Play Again (Same Room)
          </button>
        )}

        <button
          onClick={handleLeave}
          className="w-full bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold py-2 rounded-xl text-sm transition-colors"
        >
          Leave Room
        </button>
      </div>
    </div>
  );
}
