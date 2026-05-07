import React from 'react';
import { AttackResult, CellState } from '@battleplane/shared';

interface BoardProps {
  cells: CellState[][];
  highlightCells?: Set<string>;
  highlightColor?: string;
  onCellClick?: (row: number, col: number) => void;
  disabled?: boolean;
  hoverCells?: Set<string>;
  hoverValid?: boolean;
  onCellHover?: (row: number, col: number) => void;
  onBoardLeave?: () => void;
  label?: string;
}

const COL_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

function cellBg(cell: CellState, isHighlighted: boolean, isHover: boolean, hoverValid: boolean, clickable: boolean): string {
  if (isHover) return hoverValid ? 'bg-emerald-500/60' : 'bg-red-500/60';
  if (isHighlighted) return 'bg-emerald-600';
  if (!cell.attacked) return clickable ? 'bg-board hover:bg-board-hover' : 'bg-board';
  switch (cell.result) {
    case AttackResult.KILL: return 'bg-red-500';
    case AttackResult.HIT:  return 'bg-orange-500';
    case AttackResult.MISS: return 'bg-blue-300';
    default: return 'bg-board';
  }
}

function cellMarker(cell: CellState): string {
  if (!cell.attacked) return '';
  switch (cell.result) {
    case AttackResult.KILL: return '✕';
    case AttackResult.HIT:  return '✕';
    case AttackResult.MISS: return '○';
    default: return '';
  }
}

export default function Board({
  cells,
  highlightCells = new Set(),
  highlightColor,
  onCellClick,
  disabled = false,
  hoverCells = new Set(),
  hoverValid = true,
  onCellHover,
  onBoardLeave,
  label,
}: BoardProps) {
  return (
    <div className="select-none" onMouseLeave={onBoardLeave}>
      {label && (
        <div className="text-center text-slate-400 text-sm font-semibold mb-2 tracking-widest uppercase">
          {label}
        </div>
      )}
      <div className="inline-block">
        <div className="flex ml-7">
          {COL_LABELS.map(l => (
            <div key={l} className="w-8 h-5 text-center text-slate-500 text-xs">
              {l}
            </div>
          ))}
        </div>
        {cells.map((row, r) => (
          <div key={r} className="flex items-center">
            <div className="w-6 text-right text-slate-500 text-xs pr-1">{r + 1}</div>
            {row.map((cell, c) => {
              const key = `${r},${c}`;
              const isHighlighted = highlightCells.has(key);
              const isHover = hoverCells.has(key);
              const clickable = !disabled && !!onCellClick && !cell.attacked;
              const bg = highlightColor && isHighlighted
                ? highlightColor
                : cellBg(cell, isHighlighted, isHover, hoverValid, clickable);
              return (
                <div
                  key={c}
                  className={`w-8 h-8 border border-slate-700 flex items-center justify-center text-xs font-bold transition-colors duration-100 ${bg} ${clickable ? 'cursor-pointer' : 'cursor-default'}`}
                  onClick={() => clickable && onCellClick!(r, c)}
                  onMouseEnter={() => onCellHover?.(r, c)}
                >
                  {cellMarker(cell)}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
