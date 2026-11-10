// THE HOUSE — data model v1 (draft layout, DESIGN.md 2026-11-09).
//
// Coordinates are metres in plan view. Origin is the centre of the house
// footprint: x runs west (-) to east (+), z runs back (-) to front (+).
// The house footprint is 12m x 9m; the garage attaches to the east wall.
// Floors stack: basement y=-3, main y=0, upstairs y=+3 (3m floor-to-floor).
// The upstairs and basement stair flights share a wall (the stacked
// stairwell), so sound carries vertically through the whole house.

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
    x: [-6, -0.5],
    z: [-4.5, 4.5],
    items: ['phone (nightstand)', 'baseball bat (closet)', 'clothes iron'],
    notes: 'Start room. In first person, one item per hand matters.',
  },
  {
    id: 'landing',
    name: 'Landing',
    floor: 'upstairs',
    x: [-0.5, 2],
    z: [-1, 4.5],
    items: [],
    notes: 'Sees the front door below, NOT the kitchen. Stair 3 creaks.',
  },
  {
    id: 'upstairs-bathroom',
    name: 'Bathroom (Upstairs)',
    floor: 'upstairs',
    x: [-0.5, 2],
    z: [-4.5, -1],
    items: ['plunger'],
    notes: 'Lockable, small window. A barricade-and-call room, not a win room.',
  },
  {
    id: 'spare-bedroom',
    name: 'Spare Bedroom',
    floor: 'upstairs',
    x: [2, 6],
    z: [0.8, 4.5],
    items: [],
  },
  {
    id: 'office',
    name: 'Office / Third Bedroom',
    floor: 'upstairs',
    x: [2, 6],
    z: [-4.5, 0.8],
    items: [],
  },

  // ---- MAIN FLOOR — the incident floor. A loop, no dead ends. ----
  {
    id: 'living-room',
    name: 'Living Room',
    floor: 'main',
    x: [-6, -0.5],
    z: [0.8, 4.5],
    items: ['heavy glass ashtray', 'tall floor lamp', 'fireplace poker'],
  },
  {
    id: 'kitchen',
    name: 'Kitchen',
    floor: 'main',
    x: [-6, -0.5],
    z: [-4.5, 0.8],
    items: ['cast iron skillet', 'fire extinguisher', 'boiling pot'],
    notes: 'Back door to the yard and the dog. The fast ending lives here.',
  },
  {
    id: 'hall',
    name: 'Hall / Entry',
    floor: 'main',
    x: [-0.5, 2],
    z: [-4.5, 4.5],
    items: [],
    notes: 'Front door at the front; basement door off the back half, visible from the kitchen table.',
  },
  {
    id: 'dining-room',
    name: 'Dining Room',
    floor: 'main',
    x: [2, 6],
    z: [0.8, 4.5],
    items: [],
    notes: 'The corner the stalker rounds in the 30-second version.',
  },
  {
    id: 'mudroom',
    name: 'Mudroom / Laundry',
    floor: 'main',
    x: [2, 6],
    z: [-4.5, 0.8],
    items: ['laundry supplies'],
    notes: 'Between kitchen/hall and the garage internal door.',
  },

  // ---- ATTACHED GARAGE — his way in ----
  {
    id: 'garage',
    name: 'Garage (Attached)',
    floor: 'garage',
    x: [6, 11.5],
    z: [-4.5, 2],
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
  { id: 'front-door', between: ['outside', 'hall'], at: { x: 0.75, z: 4.5 } },
  { id: 'back-door', between: ['kitchen', 'outside'], at: { x: -3, z: -4.5 }, notes: 'To the yard and the dog.' },
  { id: 'living-hall', between: ['living-room', 'hall'], at: { x: -0.5, z: 2.5 } },
  { id: 'kitchen-hall', between: ['kitchen', 'hall'], at: { x: -0.5, z: -2 } },
  { id: 'hall-dining', between: ['hall', 'dining-room'], at: { x: 2, z: 2.5 } },
  { id: 'dining-mudroom', between: ['dining-room', 'mudroom'], at: { x: 4, z: 0.8 } },
  { id: 'hall-mudroom', between: ['hall', 'mudroom'], at: { x: 2, z: -2 } },
  { id: 'mudroom-garage', between: ['mudroom', 'garage'], at: { x: 6, z: -2 }, notes: 'The internal door. Its handle turns slowly.' },
  { id: 'garage-side-door', between: ['garage', 'outside'], at: { x: 8, z: -4.5 }, notes: 'Jimmied. His way in.' },
  { id: 'basement-door', between: ['hall', 'basement-open'], at: { x: 0.75, z: -4.4 }, notes: 'Stairs down share a wall with the stairs up.' },
  { id: 'stairs-up', between: ['hall', 'landing'], at: { x: 0.75, z: 3.5 }, notes: 'Stair 3 creaks.' },
  { id: 'landing-primary', between: ['landing', 'primary-bedroom'], at: { x: -0.5, z: 2.5 } },
  { id: 'landing-bathroom', between: ['landing', 'upstairs-bathroom'], at: { x: 0.75, z: -1 } },
  { id: 'landing-spare', between: ['landing', 'spare-bedroom'], at: { x: 2, z: 2.5 } },
  { id: 'landing-office', between: ['landing', 'office'], at: { x: 2, z: -2 } },
];

/** The shortest competent run, for pacing checks: bed -> stairs -> skillet. */
export const FAST_ROUTE = ['primary-bedroom', 'landing', 'hall', 'kitchen'] as const;

// Stairwells, both in the hall column (x -0.5..2), stacked on the same
// wall so sound carries vertically. Each flight is 3.4m long, 1.1m wide,
// centred so BOTH side slots in the hall stay ~0.58m clear — wider than
// the walker. (v1 had the flights at 1.3m wide: the slots pinched to
// 0.42m and Adam wedged on the stairs in his first phone test.)
// UP: main floor at the front end (z 3.9) rising to upstairs at z 0.5.
// DOWN: main floor at z -0.5 descending to the basement at z -3.9.
export const STAIR_UP = { x: [0.2, 1.3] as [number, number], z: [0.5, 3.9] as [number, number] };
export const STAIR_DOWN = { x: [0.2, 1.3] as [number, number], z: [-3.9, -0.5] as [number, number] };

/** Ground height (the floor surface y) at a plan position, given the
 *  walker's current ground height to disambiguate stacked floors. */
export function groundHeightAt(x: number, z: number, current: number): number {
  // The ramp only claims the walker when it is plausibly THEIR floor:
  // within 1.2m of their current height. Approaching a flight's
  // footprint from the wrong level (a side slot, the floor below)
  // must not snap them onto the ramp.
  if (x >= STAIR_UP.x[0] && x <= STAIR_UP.x[1] && z >= STAIR_UP.z[0] && z <= STAIR_UP.z[1]) {
    const t = (STAIR_UP.z[1] - z) / (STAIR_UP.z[1] - STAIR_UP.z[0]);
    const ramp = THREE_FLOORS[2] * Math.min(1, Math.max(0, t));
    if (Math.abs(ramp - current) <= 1.2) return ramp;
  }
  if (x >= STAIR_DOWN.x[0] && x <= STAIR_DOWN.x[1] && z >= STAIR_DOWN.z[0] && z <= STAIR_DOWN.z[1]) {
    const t = (STAIR_DOWN.z[1] - z) / (STAIR_DOWN.z[1] - STAIR_DOWN.z[0]);
    const ramp = THREE_FLOORS[0] * Math.min(1, Math.max(0, t));
    if (Math.abs(ramp - current) <= 1.2) return ramp;
  }
  const inHouse = x >= -6 && x <= 6 && z >= -4.5 && z <= 4.5;
  const inGarage = x > 6 && x <= 11.5 && z >= -4.5 && z <= 2;
  if (!inHouse && !inGarage) return 0; // the yard / street
  if (inGarage) return 0;
  // Inside the footprint every level is a candidate; take the one
  // nearest where the walker already is (stairs handle transitions).
  let best: number = THREE_FLOORS[1];
  for (const y of THREE_FLOORS) if (Math.abs(y - current) < Math.abs(best - current)) best = y;
  return best;
}

const THREE_FLOORS = [-3, 0, 3] as const;

/** Which room the walker is standing in (nearest floor wins). */
export function roomAt(x: number, z: number, groundY: number): RoomDef | null {
  let found: RoomDef | null = null;
  let bestDist = Infinity;
  for (const room of ROOMS) {
    if (x >= room.x[0] && x <= room.x[1] && z >= room.z[0] && z <= room.z[1]) {
      const dist = Math.abs(FLOOR_Y[room.floor] - groundY);
      if (dist < bestDist) {
        bestDist = dist;
        found = room;
      }
    }
  }
  return found;
}
