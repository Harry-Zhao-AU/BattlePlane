import React, { useEffect, useState } from 'react';
import { EVENTS, PlaneDefinition, CellState, computePlaneCells } from '@battleplane/shared';
import socket from '../socket';
import { useGameStore } from '../store/gameStore';
import Board from './Board';
import { isValidPlacement } from '../utils/planeUtils';

const DIRECTIONS: PlaneDefinition['direction'][] = ['up', 'right', 'down', 'left'];
const DIR_LABELS: Record<PlaneDefinition['direction'], string> = {
  up: '↑ Up', right: '→ Right', down: '↓ Down', left: '← Left',
};
const EMPTY_BOARD: CellState[][] = Array.from({ length: 10 }, () =>
  Array.from({ length: 10 }, () => ({ attacked: false }))
);

export default function PlacementScreen() {
  const store = useGameStore();
  const [planes, setPlanes] = useState<PlaneDefinition[]>([]);
  const [dirIdx, setDirIdx] = useState(0);
  const [hoverPos, setHoverPos] = useState<[number, number] | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const direction = DIRECTIONS[dirIdx];

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R') {
        setDirIdx(i => (i + 1) % 4);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const highlightCells = new Set<string>();
  planes.forEach(p => {
    computePlaneCells(p).cells.forEach(([r, c]) => highlightCells.add(`${r},${c}`));
  });

  const hoverCells = new Set<string>();
  let hoverValid = false;
  if (hoverPos && planes.length < 3) {
    const [hr, hc] = hoverPos;
    hoverValid = isValidPlacement(planes, hr, hc, direction);
    if (hoverValid || true) {
      computePlaneCells({ cockpitRow: hr, cockpitCol: hc, direction }).cells.forEach(([r, c]) => {
        hoverCells.add(`${r},${c}`);
      });
    }
  }

  const handleCellClick = (row: number, col: number) => {
    const key = `${row},${col}`;
    // Click on existing plane → remove it
    const existingIdx = planes.findIndex(p =>
      computePlaneCells(p).cells.some(([r, c]) => r === row && c === col)
    );
    if (existingIdx !== -1) {
      setPlanes(prev => prev.filter((_, i) => i !== existingIdx));
      return;
    }
    if (planes.length >= 3) return;
    if (!isValidPlacement(planes, row, col, direction)) return;
    setPlanes(prev => [...prev, { cockpitRow: row, cockpitCol: col, direction }]);
  };

  const handleSubmit = () => {
    if (planes.length !== 3) return;
    socket.emit(EVENTS.PLACEMENT_SUBMIT, { planes });
    store.setMyPlanes(planes);
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <h2 className="text-2xl font-bold text-cyan-400 mb-2">Place Your Planes</h2>
      <p className="text-slate-400 text-sm mb-6">
        Click to place • Click a plane to remove • Press <kbd className="bg-slate-700 px-1 rounded">R</kbd> to rotate
      </p>

      {store.errorMsg && (
        <div className="bg-red-900/40 border border-red-700 text-red-300 rounded-lg px-4 py-2 mb-4 text-sm">
          {store.errorMsg}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8 items-start justify-center">
        <div
          onMouseLeave={() => setHoverPos(null)}
        >
          <Board
            cells={EMPTY_BOARD}
            highlightCells={highlightCells}
            highlightColor="bg-emerald-600"
            onCellClick={submitted ? undefined : handleCellClick}
            hoverCells={hoverCells}
            hoverValid={hoverValid}
            onCellHover={(r, c) => setHoverPos([r, c])}
            label="Your Fleet"
          />
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 w-56">
          <div className="text-slate-300 font-semibold mb-3">
            Planes: {planes.length} / 3
          </div>

          <div className="mb-4">
            <div className="text-slate-400 text-xs mb-2">Direction</div>
            <div className="grid grid-cols-2 gap-2">
              {DIRECTIONS.map((d, i) => (
                <button
                  key={d}
                  onClick={() => setDirIdx(i)}
                  className={`py-1 px-2 rounded text-sm font-medium border transition-colors ${
                    i === dirIdx
                      ? 'bg-cyan-500 border-cyan-400 text-slate-900'
                      : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {DIR_LABELS[d]}
                </button>
              ))}
            </div>
          </div>

          <div className="text-slate-400 text-xs mb-2">Plane shape (facing {direction})</div>
          <PlanePreview direction={direction} />

          <button
            onClick={handleSubmit}
            disabled={planes.length !== 3 || submitted}
            className={`mt-4 w-full py-2 rounded-xl font-bold text-sm transition-colors ${
              planes.length === 3 && !submitted
                ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-900 cursor-pointer'
                : 'bg-slate-700 text-slate-500 cursor-not-allowed'
            }`}
          >
            {submitted ? 'Waiting for opponent...' : 'Ready!'}
          </button>
        </div>
      </div>
    </div>
  );
}

function PlanePreview({ direction }: { direction: PlaneDefinition['direction'] }) {
  const cells = computePlaneCells({ cockpitRow: 3, cockpitCol: 3, direction }).cells;
  const cellSet = new Set(cells.map(([r, c]) => `${r},${c}`));
  const cockpit = `3,3`;
  const size = 7;
  const offset = 0;
  return (
    <div className="inline-block">
      {Array.from({ length: size }, (_, r) => (
        <div key={r} className="flex">
          {Array.from({ length: size }, (_, c) => {
            const key = `${r},${c}`;
            const isCockpit = key === cockpit;
            const isPlane = cellSet.has(key);
            return (
              <div
                key={c}
                className={`w-5 h-5 border border-slate-700 ${
                  isCockpit ? 'bg-cyan-500' : isPlane ? 'bg-emerald-600' : 'bg-slate-800'
                }`}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
