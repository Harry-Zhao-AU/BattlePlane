import React from 'react';
import { AttackResult, CellState } from '@battleplane/shared';
import type { LastAttack } from '../store/gameStore';

interface BoardProps {
  cells: CellState[][];
  highlightCells?: Set<string>;
  highlightColor?: string;
  revealedCells?: Set<string>;
  lastAttack?: LastAttack | null;
  onCellClick?: (row: number, col: number) => void;
  disabled?: boolean;
  hoverCells?: Set<string>;
  hoverValid?: boolean;
  onCellHover?: (row: number, col: number) => void;
  onBoardLeave?: () => void;
  label?: string;
}

const COL_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

function cellBg(
  cell: CellState,
  isHighlighted: boolean,
  isRevealed: boolean,
  isHover: boolean,
  hoverValid: boolean,
  clickable: boolean
): string {
  if (isHover) return hoverValid ? 'bg-emerald-500/60' : 'bg-red-500/60';
  if (isHighlighted) return 'bg-emerald-600';
  if (!cell.attacked) {
    if (isRevealed) return 'bg-red-900/50';
    return clickable ? 'bg-board hover:bg-board-hover' : 'bg-board';
  }
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
    case AttackResult.KILL: return '✈';
    case AttackResult.HIT:  return '✕';
    case AttackResult.MISS: return '○';
    default: return '';
  }
}

function animClass(result: AttackResult): string {
  switch (result) {
    case AttackResult.KILL: return 'animate-kill';
    case AttackResult.HIT:  return 'animate-hit';
    case AttackResult.MISS: return 'animate-miss';
  }
}

export default function Board({
  cells,
  highlightCells = new Set(),
  highlightColor,
  revealedCells = new Set(),
  lastAttack,
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
              const coordKey = `${r},${c}`;
              const isHighlighted = highlightCells.has(coordKey);
              const isRevealed = revealedCells.has(coordKey);
              const isHover = hoverCells.has(coordKey);
              const clickable = !disabled && !!onCellClick && !cell.attacked;
              const bg = highlightColor && isHighlighted
                ? highlightColor
                : cellBg(cell, isHighlighted, isRevealed, isHover, hoverValid, clickable);

              const isLastAttacked = lastAttack?.row === r && lastAttack?.col === c;
              const anim = isLastAttacked ? animClass(lastAttack!.result) : '';

              // Use lastAttack.key as React key so the element remounts on each new attack,
              // restarting the CSS animation from the beginning.
              const reactKey = isLastAttacked ? `${c}-anim-${lastAttack!.key}` : c;

              // Revealed but unattacked cells of a killed plane animate in
              const revealAnim = isRevealed && !cell.attacked ? 'animate-reveal' : '';

              return (
                <div
                  key={reactKey}
                  className={`w-8 h-8 border border-slate-700 flex items-center justify-center text-xs font-bold transition-colors duration-100 ${bg} ${anim} ${revealAnim} ${clickable ? 'cursor-pointer' : 'cursor-default'}`}
                  onClick={() => clickable && onCellClick!(r, c)}
                  onMouseEnter={() => onCellHover?.(r, c)}
                >
                  {cellMarker(cell)}
                  {isRevealed && !cell.attacked && (
                    <span className="text-red-400 opacity-60">✈</span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
