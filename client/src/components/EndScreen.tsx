import React from 'react';
import { useGameStore } from '../store/gameStore';
import { useNavigate } from 'react-router-dom';

export default function EndScreen() {
  const store = useGameStore();
  const navigate = useNavigate();
  const iWon = store.winnerId === store.playerId;

  const handlePlayAgain = () => {
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
        <p className="text-slate-400 mb-8 text-sm">
          {iWon
            ? 'All enemy planes destroyed!'
            : `${store.opponentName ?? 'Opponent'} destroyed all your planes.`}
        </p>
        <button
          onClick={handlePlayAgain}
          className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold py-3 rounded-xl text-lg transition-colors"
        >
          Play Again
        </button>
      </div>
    </div>
  );
}
