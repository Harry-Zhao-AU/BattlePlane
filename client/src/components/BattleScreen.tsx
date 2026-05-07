import React, { useEffect, useMemo, useState } from 'react';
import { EVENTS, AttackResult, computePlaneCells } from '@battleplane/shared';
import socket from '../socket';
import { useGameStore } from '../store/gameStore';
import Board from './Board';

export default function BattleScreen() {
  const store = useGameStore();
  const [waiting, setWaiting] = useState(false);
  const [killToast, setKillToast] = useState(false);

  const myPlaneCells = useMemo(() => {
    const cells = new Set<string>();
    store.myPlanes.forEach(p => {
      computePlaneCells(p).cells.forEach(([r, c]) => cells.add(`${r},${c}`));
    });
    return cells;
  }, [store.myPlanes]);

  const handleAttack = (row: number, col: number) => {
    if (!store.isMyTurn || waiting) return;
    if (store.enemyBoard[row][col].attacked) return;
    setWaiting(true);
    socket.emit(EVENTS.BATTLE_ATTACK, { row, col });
  };

  // Re-enable clicking after we receive a result
  useEffect(() => {
    setWaiting(false);
  }, [store.enemyBoard, store.myBoard]);

  // Show kill toast when last attack is a KILL
  useEffect(() => {
    if (store.lastAttack?.result === AttackResult.KILL) {
      setKillToast(true);
      const t = setTimeout(() => setKillToast(false), 2200);
      return () => clearTimeout(t);
    }
  }, [store.lastAttack]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <h2 className="text-2xl font-bold text-cyan-400 mb-2">Battle!</h2>

      <div className={`mb-3 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
        store.isMyTurn
          ? 'bg-cyan-500/20 border border-cyan-500 text-cyan-300'
          : 'bg-slate-700 border border-slate-600 text-slate-400'
      }`}>
        {store.isMyTurn ? '⚡ Your Turn — Choose a target' : `⏳ ${store.opponentName ?? 'Opponent'}'s Turn`}
      </div>

      {/* Kill toast */}
      <div className={`mb-3 px-5 py-2 rounded-lg font-bold text-sm bg-red-600/90 border border-red-400 text-white transition-all duration-300 ${
        killToast ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
      }`}>
        ✈ Plane Destroyed!
      </div>

      {store.errorMsg && (
        <div className="bg-red-900/40 border border-red-700 text-red-300 rounded-lg px-4 py-2 mb-4 text-sm">
          {store.errorMsg}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8 items-start justify-center">
        <Board
          cells={store.myBoard}
          label="Your Fleet"
          highlightCells={myPlaneCells}
          highlightColor="bg-emerald-700"
          disabled
        />
        <Board
          cells={store.enemyBoard}
          label="Enemy Waters"
          revealedCells={store.revealedEnemyCells}
          lastAttack={store.lastAttack}
          onCellClick={store.isMyTurn && !waiting ? handleAttack : undefined}
          disabled={!store.isMyTurn || waiting}
        />
      </div>

      <div className="mt-6 text-slate-500 text-xs flex gap-4">
        <span><span className="text-blue-300">○</span> Miss</span>
        <span><span className="text-orange-500">✕</span> Hit</span>
        <span><span className="text-red-400">✈</span> Cockpit</span>
      </div>
    </div>
  );
}
