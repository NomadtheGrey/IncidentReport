// THE HOUSE — data model v3 (Adam's Blockbench plan, pinned 2026-11-10).
//
// Coordinates are metres in plan view. Origin is the centre of the house
// footprint: x runs west (-) to east (+), z runs back (-) to front (+).
// The house footprint is 12m x 9m; the garage attaches to the east wall.
// Floors stack: basement y=-3, main y=0, upstairs y=+3 (3m floor-to-floor).
//
// The plan is Adam's, roughed out in Blockbench from his kids' house —
// the house he can walk in his head. His model's axes (his wall names:
// +x = north, +z = east) rotate into ours: his west-east runs along our
// x, his south-north along our z. The result, in our coordinates:
//
// - A 2 x 2m hall upstairs, with the stair band running EAST from it:
//   a 2m-wide, 5m-long switchback band whose half-landing butts the
//   east house wall (Adam's pin: no dead strip beyond a landing).
// - BOTH flights stack in that one band: the up flight climbs from the
//   main hall, the down flight descends beneath it, same footprint.
// - A solid separator wall runs between the two half-flights (Adam's
//   pin: a wall, not a railing — you turn around on the landing).
// - Darleen's closet lives over the lower half-flight of the stairs,
//   at the hall end of the band (Adam, 2026-11-11): its floor is the
//   squared-off ceiling over that flight — flat, not sloped, so the
//   space is usable — with about 2m of headroom under it on the
//   flight (tight if you're well over six feet). Big for a closet,
//   too tiny for a room.
// - Whole-metre grid throughout (Adam's pin).

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
  /** A stair mouth / archway: a gap is cut, but no leaf is hung. */
  marker?: boolean;
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
    id: 'clarissas-room',
    name: "Clarissa's Room",
    floor: 'upstairs',
    x: [-6, -1],
    z: [-4.5, -0.5],
    items: ['bed', 'desk'],
    notes: 'Across the west end, south room of the pair.',
  },
  {
    id: 'breannas-room',
    name: "Breanna's Room",
    floor: 'upstairs',
    x: [-6, -1],
    z: [-0.5, 4.5],
    items: ['bed', 'bookshelf'],
    notes: 'Across the west end, north room of the pair.',
  },
  {
    id: 'upstairs-hall',
    name: 'Hall',
    floor: 'upstairs',
    x: [-1, 1],
    z: [-1.5, 0.5],
    items: [],
    notes: 'The 2 x 2m hall at the top of the stairs. Doors on all four sides.',
  },
  {
    id: 'landing',
    name: 'Landing',
    floor: 'upstairs',
    x: [1, 6],
    z: [-1.5, 0.5],
    items: [],
    notes: 'The stair band: two runs and the half-landing against the east wall.',
  },
  {
    id: 'darleens-closet',
    name: "Darleen's Closet",
    floor: 'upstairs',
    x: [1, 3],
    z: [-0.5, 0.5],
    items: ['baseball bat', 'spare blankets'],
    notes: 'Over the lower half-flight of the stairs, its floor the squared-off ceiling over that flight. Big for a closet, too tiny for a room. Door off the hall — the one the model left unpainted.',
  },
  {
    id: 'bathroom',
    name: 'Bathroom',
    floor: 'upstairs',
    x: [-1, 6],
    z: [-4.5, -1.5],
    items: ['plunger'],
    notes: 'The long room beside the stair band. Lockable — a barricade-and-call room.',
  },
  {
    id: 'darleens-room',
    name: "Darleen's Room",
    floor: 'upstairs',
    x: [-1, 6],
    z: [0.5, 4.5],
    items: ['phone (nightstand)', 'clothes iron'],
    notes: 'Start room. The long room on the north side.',
  },

  // ---- MAIN FLOOR — the incident floor ----
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
    x: [-1, 1],
    z: [-4.5, 4.5],
    items: [],
    notes: 'Front door at the front; both stair mouths open off its east side, mid-house.',
  },
  {
    id: 'main-landing',
    name: 'Landing',
    floor: 'main',
    x: [1, 6],
    z: [-1.5, 0.5],
    items: [],
    notes: 'The stair band at main level: up flight climbing, down flight descending, one footprint.',
  },
  {
    id: 'mudroom',
    name: 'Mudroom / Laundry',
    floor: 'main',
    x: [1, 6],
    z: [-4.5, -1.5],
    items: ['laundry supplies'],
    notes: 'South of the stair band. Internal door to the garage.',
  },
  {
    id: 'dining-room',
    name: 'Dining Room',
    floor: 'main',
    x: [1, 6],
    z: [0.5, 4.5],
    items: [],
    notes: 'North of the stair band.',
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
    x: [-6, 6],
    z: [-4.5, 4.5],
    items: ['chest freezer (far wall)', 'paint cans', 'holiday decorations', 'storage shelves', 'furnace', 'water heater'],
    notes: 'One open room under the whole house. A bad place to hide, a worse place to drag a man.',
  },
];

export const DOORS: DoorDef[] = [
  // Main floor.
  { id: 'front-door', between: ['outside', 'hall'], at: { x: 0, z: 4.5 }, inside: 'hall' },
  { id: 'back-door', between: ['kitchen', 'outside'], at: { x: -3, z: -4.5 }, inside: 'kitchen', notes: 'To the yard and the dog.' },
  { id: 'living-hall', between: ['living-room', 'hall'], at: { x: -1, z: 2 }, inside: 'living-room' },
  { id: 'kitchen-hall', between: ['kitchen', 'hall'], at: { x: -1, z: -2 }, inside: 'kitchen' },
  { id: 'hall-mudroom', between: ['hall', 'mudroom'], at: { x: 1, z: -3 }, inside: 'mudroom' },
  { id: 'hall-dining', between: ['hall', 'dining-room'], at: { x: 1, z: 2.5 }, inside: 'dining-room' },
  { id: 'stairs-up-mouth', between: ['hall', 'main-landing'], at: { x: 1, z: 0 }, marker: true, notes: 'The up flight\u2019s mouth (north run, Darleen\u2019s side). Stair 3 creaks.' },
  { id: 'stairs-down-mouth', between: ['hall', 'main-landing'], at: { x: 1, z: -1 }, marker: true, notes: 'The down flight\u2019s mouth (south run), beside the up mouth.' },
  { id: 'mudroom-garage', between: ['mudroom', 'garage'], at: { x: 6, z: -3 }, inside: 'mudroom', notes: 'The internal door. Its handle turns slowly.' },
  { id: 'garage-side-door', between: ['garage', 'outside'], at: { x: 9, z: -4.5 }, inside: 'garage', notes: 'Jimmied. His way in.' },
  // Upstairs.
  { id: 'hall-clarissa', between: ['upstairs-hall', 'clarissas-room'], at: { x: -1, z: -1 }, inside: 'clarissas-room' },
  { id: 'hall-breanna', between: ['upstairs-hall', 'breannas-room'], at: { x: -1, z: 0 }, inside: 'breannas-room' },
  { id: 'hall-bathroom', between: ['upstairs-hall', 'bathroom'], at: { x: 0, z: -1.5 }, inside: 'bathroom' },
  { id: 'hall-darleen', between: ['upstairs-hall', 'darleens-room'], at: { x: 0, z: 0.5 }, inside: 'darleens-room' },
  { id: 'stairs-arrival', between: ['upstairs-hall', 'landing'], at: { x: 1, z: -1 }, marker: true, notes: 'Where the up flight arrives at the hall (south run).' },
  { id: 'darleens-closet-door', between: ['landing', 'darleens-closet'], at: { x: 1, z: 0 }, inside: 'darleens-closet', notes: 'The door Adam\u2019s model left unpainted. Painted.' },
];

// NOTE — Adam's model draws one more door: off the stair band's far
// end into the back of Darleen's room (his "Dooway5"). It is NOT built:
// the half-landing sits 1.5m below her floor, so a door there cannot
// be stepped through — it fails the Frying Pan Test. Asked Adam
// 2026-11-10 what that door really is in the kids' house; if it has a
// real form, it goes in then.

/** The shortest competent run, for pacing checks: bed -> stairs -> skillet. */
export const FAST_ROUTE = ['darleens-room', 'upstairs-hall', 'hall', 'kitchen'] as const;

// ---- The stacked switchback band ---------------------------------------
// One band serves both flights: x 1..6 (mouths at x=1, off the hall;
// half-landing x 4..6 against the east house wall), z -1.5..0.5 (2m
// wide: south run z -1.5..-0.5, north run z -0.5..0.5, the separator
// wall built between them at z=-0.5). Each run is 3m long and climbs
// half a floor (1.5m); the landing is 2 x 2m.
// UP flight: enters on the NORTH run at main (Darleen's side — in
// Adam's model that run is the one drawn floored, the arriving run
// open), climbs east to the landing, returns on the SOUTH run,
// arriving at the upstairs hall. Descending, the north run is the
// LOWER half-flight — Darleen's closet floors over its low end.
// DOWN flight (stacked directly beneath): enters on the SOUTH run at
// main, descends east to its landing, returns on the NORTH run,
// arriving in the basement.
export interface ShaftDef {
  id: 'up' | 'down';
  /** The band's plan rect. */
  x: [number, number];
  z: [number, number];
  /** Where the runs run (mouth end to landing start), along x. */
  runX: [number, number];
  /** The half-landing's span along x (2m, against the east wall). */
  landingX: [number, number];
  /** Lower floor of the shaft (its base); it climbs 3m from here. */
  base: number;
  /** Which run a traveller from the base floor takes first. */
  first: 'south' | 'north';
  dir: 'up' | 'down';
}

const BAND = { x: [1, 6] as [number, number], z: [-1.5, 0.5] as [number, number], runX: [1, 4] as [number, number], landingX: [4, 6] as [number, number] };

export const SHAFT_UP: ShaftDef = { id: 'up', ...BAND, base: 0, first: 'north', dir: 'up' };
export const SHAFT_DOWN: ShaftDef = { id: 'down', ...BAND, base: -3, first: 'south', dir: 'down' };

/** Step-surface height of a shaft at a plan point, or null outside it. */
export function shaftHeightAt(shaft: ShaftDef, x: number, z: number): number | null {
  if (x < shaft.x[0] || x > shaft.x[1] || z < shaft.z[0] || z > shaft.z[1]) return null;
  if (x >= shaft.landingX[0]) return shaft.base + 1.5;
  if (x < shaft.runX[0] || x > shaft.runX[1]) return null;
  const t = (x - shaft.runX[0]) / (shaft.runX[1] - shaft.runX[0]);
  const south = z < (shaft.z[0] + shaft.z[1]) / 2;
  const isFirst = (shaft.first === 'south') === south;
  if (shaft.dir === 'up') {
    // First run climbs away from the mouth; second run climbs back to it.
    return isFirst ? shaft.base + 1.5 * t : shaft.base + 3 - 1.5 * t;
  }
  // Down: first run descends away from the mouth; second descends back.
  return isFirst ? shaft.base + 3 - 1.5 * t : shaft.base + 1.5 * t;
}

/** Floor patches inside the band: floor that exists over a run's low
 *  end, where headroom below allows (Adam's closet/headspace rule).
 *  Only one survives the stack: Darleen's closet, floored over the
 *  up flight's north run where that run is still low (the lower
 *  half-flight on the way down, on her side of the band). */
export const CLOSET_PATCHES: Array<{ x: [number, number]; z: [number, number]; y: number }> = [
  { x: [1, 3], z: [-0.5, 0.5], y: 3 }, // Darleen's closet, over the lower half-flight
];

const inRect = (x: number, z: number, r: { x: [number, number]; z: [number, number] }) =>
  x >= r.x[0] && x <= r.x[1] && z >= r.z[0] && z <= r.z[1];

/** Floor levels that genuinely exist at a plan point. The stair band
 *  is owned by its ramps on every level, except where a patch floors it. */
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
  const inBand = inRect(x, z, SHAFT_UP); // both shafts share the band
  const levels = out.filter((y) => !(inBand && (y === 3 || y === 0 || y === -3)));
  // …then put the closet patch back.
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
