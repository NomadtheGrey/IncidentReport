// THE HOUSE — data model v2 (LAYOUT-V2.md, Adam's pins 2026-11-10).
//
// Coordinates are metres in plan view. Origin is the centre of the house
// footprint: x runs west (-) to east (+), z runs back (-) to front (+).
// The house footprint is 12m x 9m; the garage attaches to the east wall.
// Floors stack: basement y=-3, main y=0, upstairs y=+3 (3m floor-to-floor).
//
// Adam's layout rules, applied throughout:
// - WHOLE-METRE grid: every room dimension / wall length is whole metres.
// - Stairs are SWITCHBACKS: a 2.0m-wide box holding two 1.0m runs with
//   the divider built between them; each run climbs half a floor (1.5m)
//   to a half-landing, where the walker turns 180 degrees.
// - Two separate boxes (front = up flight, back = down flight), both
//   mouths opening off the hall's middle strip.
// - Closet/headspace: the floor above a flight is solid over a run's
//   low half (a closet lives there) and open over its high half (the
//   well, reserved for head space).

export type FloorId = 'basement' | 'main' | 'upstairs' | 'garage';

export interface RoomDef {
  id: string;
  name: string;
  floor: FloorId;
  /** Plan-view rectangle, metres: [west, east] x [back, front]. */
  x: [number, number];
  z: [number, number];
  /** Ordinary objects that live here. Everything behaves like itself. */
  items: string[];
  notes?: string;
}

export interface DoorDef {
  id: string;
  /** Room ids this door connects; 'outside' is the yard / street. */
  between: [string, string];
  /** Plan position of the doorway, metres. */
  at: { x: number; z: number };
  /** The room the door locks FROM. Every door in this house has a
   *  standard doorknob privacy lock on its inside (Adam's pin). */
  inside?: string;
  notes?: string;
}

export const FLOOR_Y: Record<FloorId, number> = {
  basement: -3,
  main: 0,
  upstairs: 3,
  garage: 0,
};

export const ROOMS: RoomDef[] = [
  // ---- UPSTAIRS — the player starts here ----
  {
    id: 'primary-bedroom',
    name: 'Primary Bedroom',
    floor: 'upstairs',
    x: [-6, -1],
    z: [-4.5, 4.5],
    items: ['phone (nightstand)', 'baseball bat (closet)', 'clothes iron'],
    notes: 'Start room. 5 x 9m — the big room on the west.',
  },
  {
    id: 'landing',
    name: 'Landing',
    floor: 'upstairs',
    x: [-1, 2],
    z: [-4.5, 4.5],
    items: [],
    notes: 'Corridor (west) + stair shaft (east) + back/middle/front strips.',
  },
  {
    id: 'landing-closet',
    name: 'Landing Closet',
    floor: 'upstairs',
    x: [0, 1],
    z: [0.5, 1.5],
    items: ['spare blankets'],
    notes: 'Floored over the up flight\u2019s departing run, where headroom below allows.',
  },
  {
    id: 'upstairs-bathroom',
    name: 'Bathroom (Upstairs)',
    floor: 'upstairs',
    x: [2, 6],
    z: [-4.5, -1.5],
    items: ['plunger'],
    notes: 'Lockable. A barricade-and-call room, not a win room.',
  },
  {
    id: 'office',
    name: 'Office / Third Bedroom',
    floor: 'upstairs',
    x: [2, 6],
    z: [-1.5, 1.5],
    items: [],
  },
  {
    id: 'spare-bedroom',
    name: 'Spare Bedroom',
    floor: 'upstairs',
    x: [2, 6],
    z: [1.5, 4.5],
    items: [],
  },

  // ---- MAIN FLOOR — the incident floor. A loop, no dead ends. ----
  {
    id: 'kitchen',
    name: 'Kitchen',
    floor: 'main',
    x: [-6, -1],
    z: [-4.5, 0.5],
    items: ['cast iron skillet', 'fire extinguisher', 'boiling pot'],
    notes: 'Back door to the yard and the dog. The fast ending lives here.',
  },
  {
    id: 'living-room',
    name: 'Living Room',
    floor: 'main',
    x: [-6, -1],
    z: [0.5, 4.5],
    items: ['heavy glass ashtray', 'tall floor lamp', 'fireplace poker'],
  },
  {
    id: 'hall',
    name: 'Hall / Entry',
    floor: 'main',
    x: [-1, 2],
    z: [-4.5, 4.5],
    items: [],
    notes: 'Front door at the front; both stair mouths off the middle strip.',
  },
  {
    id: 'hallway-closet',
    name: 'Hallway Closet',
    floor: 'main',
    x: [0, 1],
    z: [-1.5, -0.5],
    items: ['coats', 'a board game missing pieces'],
    notes: 'Floored over the basement flight\u2019s arriving run, where headroom below allows.',
  },
  {
    id: 'mudroom',
    name: 'Mudroom / Laundry',
    floor: 'main',
    x: [2, 6],
    z: [-4.5, 0.5],
    items: ['laundry supplies'],
    notes: 'Between hall and the garage internal door.',
  },
  {
    id: 'dining-room',
    name: 'Dining Room',
    floor: 'main',
    x: [2, 6],
    z: [0.5, 4.5],
    items: [],
    notes: 'The corner the stalker rounds in the 30-second version.',
  },

  // ---- ATTACHED GARAGE — his way in ----
  {
    id: 'garage',
    name: 'Garage (Attached)',
    floor: 'garage',
    x: [6, 12],
    z: [-4.5, 1.5],
    items: ['claw hammer (workbench)', 'extension cords (pegboard)', 'shovel — "No."', 'the car'],
    notes: 'Overhead door at the front, pedestrian door to the backyard, internal door to the mudroom. The plausible entry route.',
  },

  // ---- BASEMENT — one way in, one way out ----
  {
    id: 'basement-open',
    name: 'Basement (Open)',
    floor: 'basement',
    x: [-6, 2],
    z: [-4.5, 4.5],
    items: ['chest freezer (far wall)', 'paint cans', 'holiday decorations', 'storage shelves'],
    notes: 'A bad place to hide, a worse place to drag a man.',
  },
  {
    id: 'basement-utility',
    name: 'Utility Corner',
    floor: 'basement',
    x: [2, 6],
    z: [-4.5, 4.5],
    items: ['furnace', 'water heater', 'workbench'],
    notes: 'Furnace and pipes: a whole orchestra to hide a thump in.',
  },
];

export const DOORS: DoorDef[] = [
  { id: 'front-door', between: ['outside', 'hall'], at: { x: 0, z: 4.5 }, inside: 'hall' },
  { id: 'back-door', between: ['kitchen', 'outside'], at: { x: -3, z: -4.5 }, inside: 'kitchen', notes: 'To the yard and the dog.' },
  { id: 'living-hall', between: ['living-room', 'hall'], at: { x: -1, z: 2 }, inside: 'living-room' },
  { id: 'kitchen-hall', between: ['kitchen', 'hall'], at: { x: -1, z: -2 }, inside: 'kitchen' },
  { id: 'hall-dining', between: ['hall', 'dining-room'], at: { x: 2, z: 4 }, inside: 'dining-room' },
  { id: 'dining-mudroom', between: ['dining-room', 'mudroom'], at: { x: 4, z: 0.5 }, inside: 'mudroom' },
  { id: 'hall-mudroom', between: ['hall', 'mudroom'], at: { x: 2, z: -4 }, inside: 'mudroom', notes: 'Off the back strip — no door opens alongside a flight.' },
  { id: 'hallway-closet-door', between: ['hall', 'hallway-closet'], at: { x: 0.5, z: -0.5 }, inside: 'hallway-closet' },
  { id: 'mudroom-garage', between: ['mudroom', 'garage'], at: { x: 6, z: -1 }, inside: 'mudroom', notes: 'The internal door. Its handle turns slowly.' },
  { id: 'garage-side-door', between: ['garage', 'outside'], at: { x: 9, z: -4.5 }, inside: 'garage', notes: 'Jimmied. His way in.' },
  { id: 'stairs-up', between: ['hall', 'landing'], at: { x: 0.5, z: 0.5 }, notes: 'Marker only — the up flight\u2019s mouths open off the middle strip. Stair 3 creaks.' },
  { id: 'stairs-down', between: ['hall', 'basement-open'], at: { x: 1.5, z: -0.5 }, notes: 'Marker only — the down flight\u2019s mouth, beside the up mouth.' },
  { id: 'landing-primary', between: ['landing', 'primary-bedroom'], at: { x: -1, z: 2 }, inside: 'primary-bedroom' },
  { id: 'landing-bathroom', between: ['landing', 'upstairs-bathroom'], at: { x: 2, z: -3 }, inside: 'upstairs-bathroom' },
  { id: 'landing-office', between: ['landing', 'office'], at: { x: 2, z: -1 }, inside: 'office' },
  { id: 'landing-spare', between: ['landing', 'spare-bedroom'], at: { x: 2, z: 4 }, inside: 'spare-bedroom' },
  { id: 'landing-closet-door', between: ['landing', 'landing-closet'], at: { x: 0.5, z: 0.5 }, inside: 'landing-closet' },
];

/** The shortest competent run, for pacing checks: bed -> stairs -> skillet. */
export const FAST_ROUTE = ['primary-bedroom', 'landing', 'hall', 'kitchen'] as const;

// ---- Switchback stair shafts -------------------------------------------
// Each shaft: a 2.0m-wide box (x 0..2) in the hall column. West run
// x 0..1, east run x 1..2, divider built between them inside the 2.0.
// The half-landing (1m deep) sits at the box's far end from the mouths;
// both mouths open off the hall's middle strip (z -0.5..0.5).
// UP shaft (front box): mouths at z 0.5; west run climbs main->half,
// east run climbs half->upstairs. DOWN shaft (back box): mouths at
// z -0.5; east run descends main->half, west run descends half->basement.
export interface ShaftDef {
  id: 'up' | 'down';
  x: [number, number];
  z: [number, number];
  runZ: [number, number];
  landingZ: [number, number];
  /** Lower floor of the shaft (its base); it climbs 3m from here. */
  base: number;
}

export const SHAFT_UP: ShaftDef = {
  id: 'up',
  x: [0, 2],
  z: [0.5, 3.5],
  runZ: [0.5, 2.5],
  landingZ: [2.5, 3.5],
  base: 0,
};

export const SHAFT_DOWN: ShaftDef = {
  id: 'down',
  x: [0, 2],
  z: [-3.5, -0.5],
  runZ: [-2.5, -0.5],
  landingZ: [-3.5, -2.5],
  base: -3,
};

/** Step-surface height of a shaft at a plan point, or null outside it. */
export function shaftHeightAt(shaft: ShaftDef, x: number, z: number): number | null {
  if (x < shaft.x[0] || x > shaft.x[1] || z < shaft.z[0] || z > shaft.z[1]) return null;
  const half = shaft.base + 1.5;
  if (z >= shaft.landingZ[0] && z <= shaft.landingZ[1]) return half;
  if (z < shaft.runZ[0] || z > shaft.runZ[1]) return null;
  const west = x < (shaft.x[0] + shaft.x[1]) / 2;
  if (shaft.id === 'up') {
    // t: 0 at the mouth end (runZ[0]), 1 at the landing end.
    const t = (z - shaft.runZ[0]) / (shaft.runZ[1] - shaft.runZ[0]);
    return west ? shaft.base + 1.5 * t : shaft.base + 3 - 1.5 * t;
  }
  // down: t: 0 at the landing end (runZ[0]), 1 at the mouth end.
  const t = (z - shaft.runZ[0]) / (shaft.runZ[1] - shaft.runZ[0]);
  return west ? half - 1.5 * t : half + 1.5 * t;
}

/** The closet floor patches: floor that exists INSIDE a shaft's box,
 *  over a run's low half (Adam's closet/headspace rule). */
export const CLOSET_PATCHES: Array<{ x: [number, number]; z: [number, number]; y: number }> = [
  { x: [0, 1], z: [-1.5, -0.5], y: 0 }, // hallway closet, over the down flight
  { x: [0, 1], z: [0.5, 1.5], y: 3 }, // landing closet, over the up flight
];

const inRect = (x: number, z: number, r: { x: [number, number]; z: [number, number] }) =>
  x >= r.x[0] && x <= r.x[1] && z >= r.z[0] && z <= r.z[1];

/** Floor levels that genuinely exist at a plan point. Shaft boxes are
 *  owned by their ramps, except where a closet patch floors them. */
function floorCandidatesAt(x: number, z: number): number[] {
  const inHouse = x >= -6 && x <= 6 && z >= -4.5 && z <= 4.5;
  const inGarage = x > 6 && x <= 12 && z >= -4.5 && z <= 1.5;
  if (!inHouse && !inGarage) return [0]; // the yard / street
  if (inGarage) return [0];
  const out: number[] = [];
  for (const room of ROOMS) {
    if (!inRect(x, z, room)) continue;
    const y = FLOOR_Y[room.floor];
    if (!out.includes(y)) out.push(y);
  }
  // Carve the shaft boxes out of their own levels' floors…
  const inUp = inRect(x, z, SHAFT_UP);
  const inDown = inRect(x, z, SHAFT_DOWN);
  let levels = out.filter((y) => {
    if (y === 3 && inUp) return false; // upstairs floor is open well over the up shaft
    if (y === 0 && (inUp || inDown)) return false; // main floor likewise over both shafts
    if (y === -3 && inDown) return false; // basement floor under the down shaft is ramp
    return true;
  });
  // …then put the closet patches back.
  for (const patch of CLOSET_PATCHES) {
    if (inRect(x, z, patch) && !levels.includes(patch.y)) levels.push(patch.y);
  }
  return levels;
}

/** Ground height (the floor surface y) at a plan position, given the
 *  walker's current ground height to disambiguate stacked floors. */
export function groundHeightAt(x: number, z: number, current: number): number {
  const candidates = floorCandidatesAt(x, z);
  for (const shaft of [SHAFT_UP, SHAFT_DOWN]) {
    const h = shaftHeightAt(shaft, x, z);
    if (h !== null) candidates.push(h);
  }
  // Take the candidate nearest the walker's current height, but a
  // candidate more than 1.2m away never claims them (no snapping onto
  // a ramp or a stacked floor from the wrong level).
  let best: number | null = null;
  for (const c of candidates) {
    if (best === null || Math.abs(c - current) < Math.abs(best - current)) best = c;
  }
  if (best !== null && Math.abs(best - current) <= 1.2) return best;
  // Fallback: the nearest real floor, however far (spawn / recovery).
  const floors = floorCandidatesAt(x, z);
  let fb: number | null = null;
  for (const c of floors) {
    if (fb === null || Math.abs(c - current) < Math.abs(fb - current)) fb = c;
  }
  return fb ?? current;
}

/** Which room the walker is standing in (nearest floor wins; on a tie
 *  the smaller room wins, so the closets report themselves). */
export function roomAt(x: number, z: number, groundY: number): RoomDef | null {
  let found: RoomDef | null = null;
  let bestDist = Infinity;
  let bestArea = Infinity;
  for (const room of ROOMS) {
    if (x >= room.x[0] && x <= room.x[1] && z >= room.z[0] && z <= room.z[1]) {
      const dist = Math.abs(FLOOR_Y[room.floor] - groundY);
      const area = (room.x[1] - room.x[0]) * (room.z[1] - room.z[0]);
      if (dist < bestDist || (dist === bestDist && area < bestArea)) {
        bestDist = dist;
        bestArea = area;
        found = room;
      }
    }
  }
  return found;
}
