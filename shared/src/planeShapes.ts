import type { PlaneDefinition } from './types';

// Offsets from cockpit for a plane facing UP: [deltaRow, deltaCol]
export const PLANE_OFFSETS_UP: [number, number][] = [
  [0, 0],   // cockpit
  [1, 0],   // body row 1 (wing center)
  [1, -1],  // wing left 1
  [1, -2],  // wing left 2
  [1, 1],   // wing right 1
  [1, 2],   // wing right 2
  [2, 0],   // body row 2
  [3, 0],   // tail center
  [3, -1],  // tail left
  [3, 1],   // tail right
];

function rotateOffset(dr: number, dc: number, direction: PlaneDefinition['direction']): [number, number] {
  switch (direction) {
    case 'up':    return [dr, dc];
    case 'right': return [dc, -dr];
    case 'down':  return [-dr, -dc];
    case 'left':  return [-dc, dr];
  }
}

export function computePlaneCells(plane: PlaneDefinition): { cells: [number, number][]; cockpit: [number, number] } {
  const cells = PLANE_OFFSETS_UP.map(([dr, dc]) => {
    const [rdr, rdc] = rotateOffset(dr, dc, plane.direction);
    return [plane.cockpitRow + rdr, plane.cockpitCol + rdc] as [number, number];
  });
  return { cells, cockpit: [plane.cockpitRow, plane.cockpitCol] };
}
