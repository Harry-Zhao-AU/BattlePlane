import { PlaneDefinition } from '@battleplane/shared';
import { computePlaneCells } from '@battleplane/shared';

export function getPlanePreviewCells(
  cockpitRow: number,
  cockpitCol: number,
  direction: PlaneDefinition['direction']
): [number, number][] {
  return computePlaneCells({ cockpitRow, cockpitCol, direction }).cells;
}

export function isValidPlacement(
  planes: PlaneDefinition[],
  cockpitRow: number,
  cockpitCol: number,
  direction: PlaneDefinition['direction'],
  excludeIndex?: number
): boolean {
  const newCells = getPlanePreviewCells(cockpitRow, cockpitCol, direction);

  for (const [r, c] of newCells) {
    if (r < 0 || r > 9 || c < 0 || c > 9) return false;
  }

  const existingCellKeys = new Set<string>();
  planes.forEach((p, i) => {
    if (i === excludeIndex) return;
    const { cells } = computePlaneCells(p);
    cells.forEach(([r, c]) => existingCellKeys.add(`${r},${c}`));
  });

  for (const [r, c] of newCells) {
    if (existingCellKeys.has(`${r},${c}`)) return false;
  }

  return true;
}
