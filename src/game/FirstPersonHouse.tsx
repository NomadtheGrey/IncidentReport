import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  CLOSET_PATCHES,
  DOORS,
  FLOOR_Y,
  ROOMS,
  SHAFT_DOWN,
  SHAFT_UP,
  groundHeightAt,
  roomAt,
  shaftHeightAt,
  type FloorId,
  type ShaftDef,
} from './house';

// First-person walkable house (layout v3, Adam's Blockbench plan).
// - The solid house: floors stacked at real heights, walls built from the
//   room rectangles in house.ts with door gaps cut where DOORS say, and
//   both stair flights stacked in the one east band off the hall.
// - Doors are hinged leaves with inside privacy locks (E / Lock button).
// - Desktop: click to pointer-lock, mouse look, WASD / arrows, Shift run.
// - Phone: left-thumb virtual joystick (dynamic origin, push past ~85%
//   to run), drag anywhere else to look.
// - Collision is a circle vs wall boxes, per axis; ground height comes
//   from house.ts groundHeightAt (stairs are ramps in that function).

interface Collider {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  minY: number;
  maxY: number;
  /** When set, this collider is a door leaf's swing-space: it stops
   *  blocking once that leaf has swung open. */
  doorIdx?: number;
}

export interface DoorLeaf {
  id: string;
  pivot: THREE.Group;
  openAngle: number;
  open01: number;
  cx: number;
  cz: number;
  /** Doorknob privacy lock, set from the inside only (Adam's pin). */
  locked: boolean;
  /** Which plan axis the door plane faces: 'x' = the wall runs along z. */
  axis: 'x' | 'z';
  /** Direction (+1/-1 along axis) from the doorway toward the inside room. */
  insideSign: number;
}

const WALL_H = 2.7;
const DOOR_W = 0.92;
const DOOR_H = 2.1;
const EYE = 1.62;
const RADIUS = 0.22;

const FLOOR_TINT: Record<FloorId, number> = {
  basement: 0x55555f,
  main: 0x8a7a5f,
  upstairs: 0x71808e,
  garage: 0x767676,
};

function buildHouse(scene: THREE.Scene): { colliders: Collider[]; leaves: DoorLeaf[] } {
  const colliders: Collider[] = [];
  const wallMat = new THREE.MeshStandardMaterial({ color: 0xcfc8b8, roughness: 0.95 });
  const wallMatLow = new THREE.MeshStandardMaterial({ color: 0x9b9587, roughness: 0.95 });
  const stepMat = new THREE.MeshStandardMaterial({ color: 0x7d6248, roughness: 0.9 });

  const addBox = (
    w: number, h: number, d: number,
    x: number, y: number, z: number,
    mat: THREE.Material, collide: boolean,
  ) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.position.set(x, y, z);
    scene.add(mesh);
    if (collide) {
      colliders.push({
        minX: x - w / 2, maxX: x + w / 2,
        minZ: z - d / 2, maxZ: z + d / 2,
        minY: y - h / 2, maxY: y + h / 2,
      });
    }
    return mesh;
  };

  // ---- Floor slabs (top surface at the floor's y), with holes ----
  // Holes: the shaft wells (with the closet patches kept as floor) and
  // the closet footprints themselves, whose own rooms draw their slabs.
  type Rect = { x: [number, number]; z: [number, number] };
  const subtractRect = (pieces: Rect[], hole: Rect): Rect[] => {
    const out: Rect[] = [];
    for (const p of pieces) {
      const ix: [number, number] = [Math.max(p.x[0], hole.x[0]), Math.min(p.x[1], hole.x[1])];
      const iz: [number, number] = [Math.max(p.z[0], hole.z[0]), Math.min(p.z[1], hole.z[1])];
      if (ix[0] >= ix[1] || iz[0] >= iz[1]) {
        out.push(p);
        continue;
      }
      if (hole.x[0] > p.x[0]) out.push({ x: [p.x[0], hole.x[0]], z: p.z });
      if (hole.x[1] < p.x[1]) out.push({ x: [hole.x[1], p.x[1]], z: p.z });
      if (hole.z[0] > p.z[0]) out.push({ x: ix, z: [p.z[0], hole.z[0]] });
      if (hole.z[1] < p.z[1]) out.push({ x: ix, z: [hole.z[1], p.z[1]] });
    }
    return out.filter((p) => p.x[1] - p.x[0] > 0.001 && p.z[1] - p.z[0] > 0.001);
  };
  const holesFor = (room: (typeof ROOMS)[number]): Rect[] => {
    const holes: Rect[] = [];
    const carve = (shaft: ShaftDef, keep: Rect[]) => {
      // The whole band is a well except the patches that stay floored.
      let pieces: Rect[] = [{ x: shaft.x, z: shaft.z }];
      for (const k of keep) pieces = subtractRect(pieces, k);
      holes.push(...pieces);
    };
    if (room.id === 'landing') {
      carve(SHAFT_UP, CLOSET_PATCHES.filter((p) => p.y === 3));
    }
    if (room.id === 'main-landing') {
      // The main floor inside the band is the flights themselves.
      carve(SHAFT_DOWN, []);
    }
    // Any room that contains a same-floor closet leaves the closet's
    // footprint out of its own slab; the closet draws its own.
    for (const c of ROOMS) {
      if (c.id === room.id || !c.id.includes('closet')) continue;
      if (FLOOR_Y[c.floor] !== FLOOR_Y[room.floor]) continue;
      if (c.x[0] >= room.x[0] && c.x[1] <= room.x[1] && c.z[0] >= room.z[0] && c.z[1] <= room.z[1]) {
        holes.push({ x: c.x, z: c.z });
      }
    }
    return holes;
  };
  const slabFor = (room: (typeof ROOMS)[number]) => {
    const y = FLOOR_Y[room.floor];
    const mat = new THREE.MeshStandardMaterial({ color: FLOOR_TINT[room.floor], roughness: 0.9 });
    let pieces: Rect[] = [{ x: room.x, z: room.z }];
    for (const hole of holesFor(room)) pieces = subtractRect(pieces, hole);
    for (const p of pieces) {
      const w = p.x[1] - p.x[0];
      const d = p.z[1] - p.z[0];
      if (w <= 0 || d <= 0) continue;
      addBox(w, 0.15, d, (p.x[0] + p.x[1]) / 2, y - 0.075, (p.z[0] + p.z[1]) / 2, mat, false);
    }
  };
  ROOMS.forEach(slabFor);

  // Ceilings for the topmost levels (upstairs + garage). Lower levels
  // are already capped by the floor slab above them.
  for (const room of ROOMS) {
    if (room.floor !== 'upstairs' && room.floor !== 'garage') continue;
    const y = FLOOR_Y[room.floor] + WALL_H;
    addBox(
      room.x[1] - room.x[0], 0.12, room.z[1] - room.z[0],
      (room.x[0] + room.x[1]) / 2, y + 0.06, (room.z[0] + room.z[1]) / 2,
      wallMatLow, false,
    );
  }

  // ---- Walls: union room edges per level, cut door gaps ----
  type Edge = { orient: 'v' | 'h'; coord: number; from: number; to: number };
  const levels: Array<{ y: number; floors: FloorId[] }> = [
    { y: -3, floors: ['basement'] },
    { y: 0, floors: ['main', 'garage'] },
    { y: 3, floors: ['upstairs'] },
  ];

  // Which levels a door belongs to, from the floors of the rooms it joins.
  const doorLevels = (door: (typeof DOORS)[number]): number[] => {
    const ys = new Set<number>();
    for (const id of door.between) {
      const room = ROOMS.find((r) => r.id === id);
      if (room) ys.add(FLOOR_Y[room.floor]);
    }
    return [...ys];
  };

  for (const level of levels) {
    const edgeMap = new Map<string, Edge[]>();
    const pushEdge = (e: Edge) => {
      const key = `${e.orient}|${e.coord.toFixed(2)}`;
      const list = edgeMap.get(key) ?? [];
      list.push(e);
      edgeMap.set(key, list);
    };
    for (const room of ROOMS) {
      if (!level.floors.includes(room.floor)) continue;
      pushEdge({ orient: 'v', coord: room.x[0], from: room.z[0], to: room.z[1] });
      pushEdge({ orient: 'v', coord: room.x[1], from: room.z[0], to: room.z[1] });
      pushEdge({ orient: 'h', coord: room.z[0], from: room.x[0], to: room.x[1] });
      pushEdge({ orient: 'h', coord: room.z[1], from: room.x[0], to: room.x[1] });
    }

    for (const edges of edgeMap.values()) {
      // Merge overlapping / touching intervals on this line.
      const sorted = [...edges].sort((a, b) => a.from - b.from);
      const merged: Array<{ from: number; to: number }> = [];
      for (const e of sorted) {
        const last = merged[merged.length - 1];
        if (last && e.from <= last.to + 0.01) last.to = Math.max(last.to, e.to);
        else merged.push({ from: e.from, to: e.to });
      }
      const { orient, coord } = edges[0];

      // Door gaps on this line at this level (stair markers are not doors).
      const gaps: Array<{ from: number; to: number }> = [];
      for (const door of DOORS) {
        if (!doorLevels(door).includes(level.y)) continue;
        const onLine =
          orient === 'v'
            ? Math.abs(door.at.x - coord) < 0.3
            : Math.abs(door.at.z - coord) < 0.3;
        if (!onLine) continue;
        const pos = orient === 'v' ? door.at.z : door.at.x;
        gaps.push({ from: pos - DOOR_W / 2, to: pos + DOOR_W / 2 });
      }

      for (const seg of merged) {
        // Subtract gaps from this interval.
        let cuts = [{ from: seg.from, to: seg.to }];
        for (const gap of gaps) {
          const next: typeof cuts = [];
          for (const c of cuts) {
            if (gap.to <= c.from || gap.from >= c.to) {
              next.push(c);
              continue;
            }
            if (gap.from > c.from) next.push({ from: c.from, to: gap.from });
            if (gap.to < c.to) next.push({ from: gap.to, to: c.to });
          }
          cuts = next;
          // Lintel over the part of the gap inside this interval.
          const lf = Math.max(gap.from, seg.from);
          const lt = Math.min(gap.to, seg.to);
          if (lt > lf) {
            const len = lt - lf;
            const mid = (lf + lt) / 2;
            if (orient === 'v') {
              addBox(0.12, WALL_H - DOOR_H, len, coord, level.y + DOOR_H + (WALL_H - DOOR_H) / 2, mid, wallMat, false);
            } else {
              addBox(len, WALL_H - DOOR_H, 0.12, mid, level.y + DOOR_H + (WALL_H - DOOR_H) / 2, coord, wallMat, false);
            }
          }
        }
        for (const c of cuts) {
          const len = c.to - c.from;
          if (len <= 0.02) continue;
          const mid = (c.from + c.to) / 2;
          if (orient === 'v') {
            addBox(0.12, WALL_H, len, coord, level.y + WALL_H / 2, mid, level.y === -3 ? wallMatLow : wallMat, true);
          } else {
            addBox(len, WALL_H, 0.12, mid, level.y + WALL_H / 2, coord, level.y === -3 ? wallMatLow : wallMat, true);
          }
        }
      }
    }
  }

  // ---- The stacked switchback band: steps, landings, the spine ----
  const doorMat = new THREE.MeshStandardMaterial({ color: 0x6e4f2e, roughness: 0.85 });
  const buildShaft = (shaft: ShaftDef) => {
    const base = shaft.base;
    const N = 8;
    const runLen = shaft.runX[1] - shaft.runX[0];
    const midZ = (shaft.z[0] + shaft.z[1]) / 2;
    const runs: Array<[number, number]> = [
      [shaft.z[0], midZ],
      [midZ, shaft.z[1]],
    ];
    for (const runZ of runs) {
      const zc = (runZ[0] + runZ[1]) / 2;
      for (let i = 0; i < N; i++) {
        const xA = shaft.runX[0] + (i * runLen) / N;
        const xB = shaft.runX[0] + ((i + 1) * runLen) / N;
        const surf = Math.max(
          shaftHeightAt(shaft, xA, zc) ?? base,
          shaftHeightAt(shaft, xB, zc) ?? base,
        );
        // The down flight stands solid on the basement floor. The up
        // flight is a sloped slab: the down flight passes beneath it.
        const bottom = shaft.dir === 'down' ? base - 0.05 : surf - 0.5;
        const h = surf - bottom;
        if (h <= 0) continue;
        addBox(xB - xA + 0.03, h, runZ[1] - runZ[0] - 0.04, (xA + xB) / 2, bottom + h / 2, zc, stepMat, false);
      }
    }
    // The half-landing: one block spanning the band, against the east wall.
    const landTop = base + 1.5;
    const landBottom = shaft.dir === 'down' ? base - 0.05 : landTop - 0.5;
    addBox(
      shaft.landingX[1] - shaft.landingX[0], landTop - landBottom, shaft.z[1] - shaft.z[0],
      (shaft.landingX[0] + shaft.landingX[1]) / 2, landBottom + (landTop - landBottom) / 2, midZ,
      stepMat, false,
    );
  };
  buildShaft(SHAFT_UP);
  buildShaft(SHAFT_DOWN);

  // The separator: a SOLID wall between the two runs (Adam's pin — a
  // wall, not a railing), stepped from the down flight's surface up to
  // a guard height over the up flight's. It stops one segment short of
  // each end of the runs — a guard that reaches the very mouth turns
  // its end into a sticky corner. You turn around its end, on the
  // landing.
  {
    const N = 8;
    const runLen = SHAFT_UP.runX[1] - SHAFT_UP.runX[0];
    const midZ = (SHAFT_UP.z[0] + SHAFT_UP.z[1]) / 2;
    for (let i = 1; i < N - 1; i++) {
      const xA = SHAFT_UP.runX[0] + (i * runLen) / N;
      const xB = SHAFT_UP.runX[0] + ((i + 1) * runLen) / N;
      const xm = (xA + xB) / 2;
      const upSurf = Math.max(
        shaftHeightAt(SHAFT_UP, xm, SHAFT_UP.z[0] + 0.25) ?? 0,
        shaftHeightAt(SHAFT_UP, xm, SHAFT_UP.z[1] - 0.25) ?? 0,
      );
      const downSurf = Math.min(
        shaftHeightAt(SHAFT_DOWN, xm, SHAFT_DOWN.z[0] + 0.25) ?? -3,
        shaftHeightAt(SHAFT_DOWN, xm, SHAFT_DOWN.z[1] - 0.25) ?? -3,
      );
      const top = Math.min(upSurf + 0.95, 3.95);
      const bottom = downSurf - 0.05;
      const h = top - bottom;
      if (h <= 0) continue;
      addBox(xB - xA + 0.02, h, 0.1, xm, bottom + h / 2, midZ, wallMat, true);
    }
  }

  // Basement enclosures: the down flight's flanks where it crosses the
  // open basement, stepped from the floor to guard height over the
  // ramps, so nobody walks into the side of the flight.
  {
    const N = 10;
    for (const sideZ of [SHAFT_DOWN.z[0], SHAFT_DOWN.z[1]]) {
      const zc = sideZ === SHAFT_DOWN.z[0] ? SHAFT_DOWN.z[0] + 0.25 : SHAFT_DOWN.z[1] - 0.25;
      for (let i = 0; i < N; i++) {
        const xA = SHAFT_DOWN.x[0] + (i * (SHAFT_DOWN.x[1] - SHAFT_DOWN.x[0])) / N;
        const xB = SHAFT_DOWN.x[0] + ((i + 1) * (SHAFT_DOWN.x[1] - SHAFT_DOWN.x[0])) / N;
        const surf = shaftHeightAt(SHAFT_DOWN, (xA + xB) / 2, zc) ?? -3;
        const top = surf + 0.95;
        const h = top - (SHAFT_DOWN.base - 0.05);
        if (h <= 0) continue;
        addBox(xB - xA + 0.02, h, 0.1, (xA + xB) / 2, SHAFT_DOWN.base - 0.05 + h / 2, sideZ, wallMatLow, true);
      }
    }
  }

  // The solid under the down flight's north run and landing: a
  // collider only (the steps already draw the mass). Its top sits
  // below the lowest body band of a walker ON the down ramps.
  const addBlock = (x: [number, number], z: [number, number], y0: number, y1: number) => {
    colliders.push({ minX: x[0], maxX: x[1], minZ: z[0], maxZ: z[1], minY: y0, maxY: y1 });
  };
  addBlock([1, 6], [-0.5, 0.5], -3, -1.7);

  // ---- Door leaves: hinged, swinging, real ----
  // Every doorway in DOORS (except the stair-mouth markers) gets a leaf
  // on a hinge at one end of its gap. Leaves swing INTO the room they
  // open into, driven by the walker's proximity (see the tick loop):
  // approach and the door opens; walk away and it swings shut behind.
  const leaves: DoorLeaf[] = [];
  for (const door of DOORS) {
    if (door.marker) continue;
    const rooms = door.between
      .map((id) => ROOMS.find((r) => r.id === id))
      .filter((r): r is (typeof ROOMS)[number] => !!r);
    if (rooms.length === 0) continue;
    const floorY = FLOOR_Y[rooms[0].floor];
    const home = rooms[0];
    const into = rooms[1] ?? rooms[0];
    const onXEdge =
      Math.abs(door.at.x - home.x[0]) < 0.01 || Math.abs(door.at.x - home.x[1]) < 0.01;
    const pivot = new THREE.Group();
    let leafMesh: THREE.Mesh;
    let openAngle: number;
    if (onXEdge) {
      // Wall runs along z; hinge at the gap's low-z end.
      pivot.position.set(door.at.x, floorY, door.at.z - DOOR_W / 2);
      leafMesh = new THREE.Mesh(new THREE.BoxGeometry(0.05, DOOR_H, DOOR_W), doorMat);
      leafMesh.position.set(0, DOOR_H / 2, DOOR_W / 2);
      const side = Math.sign((into.x[0] + into.x[1]) / 2 - door.at.x) || 1;
      openAngle = side * 1.75;
    } else {
      // Wall runs along x; hinge at the gap's low-x end.
      pivot.position.set(door.at.x - DOOR_W / 2, floorY, door.at.z);
      leafMesh = new THREE.Mesh(new THREE.BoxGeometry(DOOR_W, DOOR_H, 0.05), doorMat);
      leafMesh.position.set(DOOR_W / 2, DOOR_H / 2, 0);
      const side = Math.sign((into.z[0] + into.z[1]) / 2 - door.at.z) || 1;
      openAngle = -side * 1.75;
    }
    pivot.add(leafMesh);
    scene.add(pivot);
    const idx = leaves.length;
    const insideRoom = door.inside ? ROOMS.find((r) => r.id === door.inside) : undefined;
    const insideSign = insideRoom
      ? onXEdge
        ? Math.sign((insideRoom.x[0] + insideRoom.x[1]) / 2 - door.at.x) || 1
        : Math.sign((insideRoom.z[0] + insideRoom.z[1]) / 2 - door.at.z) || 1
      : 1;
    leaves.push({
      id: door.id, pivot, openAngle, open01: 0, cx: door.at.x, cz: door.at.z,
      locked: false, axis: onXEdge ? 'x' : 'z', insideSign,
    });
    // The closed leaf blocks its doorway; the collider steps aside
    // once the leaf has swung (checked in collides()).
    const block: Collider = onXEdge
      ? {
          minX: door.at.x - 0.09, maxX: door.at.x + 0.09,
          minZ: door.at.z - DOOR_W / 2, maxZ: door.at.z + DOOR_W / 2,
          minY: floorY, maxY: floorY + DOOR_H, doorIdx: idx,
        }
      : {
          minX: door.at.x - DOOR_W / 2, maxX: door.at.x + DOOR_W / 2,
          minZ: door.at.z - 0.09, maxZ: door.at.z + 0.09,
          minY: floorY, maxY: floorY + DOOR_H, doorIdx: idx,
        };
    colliders.push(block);
  }

  // ---- The world outside: one big dark ground plane at street level ----
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(45, 40),
    new THREE.MeshStandardMaterial({ color: 0x1d241c, roughness: 1 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.09;
  scene.add(ground);

  return { colliders, leaves };
}

export default function FirstPersonHouse() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [roomName, setRoomName] = useState("Darleen's Room");
  const [doorNote, setDoorNote] = useState<string | null>(null);
  const lockActionRef = useRef<(() => void) | null>(null);
  const [isTouch, setIsTouch] = useState(false);
  const [stick, setStick] = useState<{ ox: number; oy: number; dx: number; dy: number } | null>(null);

  const inputRef = useRef({
    keys: new Set<string>(),
    yaw: -Math.PI / 2, // face east, toward the bedroom door
    pitch: 0,
    stickVec: { x: 0, y: 0, mag: 0 },
    pos: new THREE.Vector3(3, 3, 2.5),
    ground: 3,
  });
  const stickPointerRef = useRef<number | null>(null);
  const stickOriginRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const lookPointerRef = useRef<{ id: number; x: number; y: number } | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const input = inputRef.current;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x07080c);
    scene.fog = new THREE.Fog(0x07080c, 30, 80);

    const camera = new THREE.PerspectiveCamera(72, mount.clientWidth / mount.clientHeight, 0.05, 120);
    camera.rotation.order = 'YXZ';

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    // Phone performance cap: never render above 1.75x on hi-dpi screens.
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.domElement.style.touchAction = 'none';
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xdfe8ff, 0x2a241d, 0.95));
    const moon = new THREE.DirectionalLight(0xaFC4ff, 0.7);
    moon.position.set(-12, 20, 10);
    scene.add(moon);
    // Warm practicals so interiors read at night without a flashlight yet.
    for (const [x, y, z] of [
      [-3, 2.4, 0],
      [3.5, 2.4, -3],
      [0.7, 5.4, 2],
      [-3.5, 5.4, 0],
      [3, 5.4, -3],
      [8.5, 2.4, -1],
      [0, -0.6, 0],
    ] as const) {
      const p = new THREE.PointLight(0xffd9a0, 12, 11, 1.8);
      p.position.set(x, y, z);
      scene.add(p);
    }

    const { colliders, leaves } = buildHouse(scene);

    const collides = (x: number, z: number, ground: number): boolean => {
      const bodyLo = ground + 0.05;
      const bodyHi = ground + 1.75;
      for (const c of colliders) {
        if (c.doorIdx !== undefined && leaves[c.doorIdx].open01 > 0.45) continue;
        if (bodyHi < c.minY || bodyLo > c.maxY) continue;
        if (
          x + RADIUS > c.minX && x - RADIUS < c.maxX &&
          z + RADIUS > c.minZ && z - RADIUS < c.maxZ
        ) {
          return true;
        }
      }
      return false;
    };

    const onKey = (down: boolean) => (e: KeyboardEvent) => {
      if (down) input.keys.add(e.code);
      else input.keys.delete(e.code);
    };
    const kd = onKey(true);
    const ku = onKey(false);
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);

    const onMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement !== renderer.domElement) return;
      input.yaw -= e.movementX * 0.0022;
      input.pitch = Math.max(-1.35, Math.min(1.35, input.pitch - e.movementY * 0.0022));
    };
    document.addEventListener('mousemove', onMouseMove);
    const onCanvasClick = () => {
      if (window.matchMedia('(pointer: fine)').matches) {
        renderer.domElement.requestPointerLock();
      }
    };
    renderer.domElement.addEventListener('click', onCanvasClick);

    let lastRoom = '';
    let lastDoorNote: string | null = null;
    // Lock / unlock the nearest door — inside only. A real knob
    // twists whether the door is open or shut; the lock state just
    // takes effect (outside can't open it once it's shut). Requiring
    // "shut" would be unworkable here anyway: the door auto-opens
    // whenever you step close enough to reach the knob.
    const toggleLock = () => {
      let best: DoorLeaf | null = null;
      let bestD = Infinity;
      let bestInside = false;
      for (const leaf of leaves) {
        const d = Math.hypot(input.pos.x - leaf.cx, input.pos.z - leaf.cz);
        if (d < bestD) {
          best = leaf;
          bestD = d;
          const off = leaf.axis === 'x' ? input.pos.x - leaf.cx : input.pos.z - leaf.cz;
          bestInside = off === 0 || Math.sign(off) === leaf.insideSign;
        }
      }
      if (best && bestD < 1.3 && bestInside) {
        best.locked = !best.locked;
      }
    };
    lockActionRef.current = toggleLock;
    const onLockKey = (e: KeyboardEvent) => {
      if (e.code === 'KeyE') toggleLock();
    };
    window.addEventListener('keydown', onLockKey);
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      // Intended move direction in camera space.
      let mx = 0;
      let mz = 0;
      const k = input.keys;
      if (k.has('KeyW') || k.has('ArrowUp')) mz += 1;
      if (k.has('KeyS') || k.has('ArrowDown')) mz -= 1;
      if (k.has('KeyA') || k.has('ArrowLeft')) mx -= 1;
      if (k.has('KeyD') || k.has('ArrowRight')) mx += 1;
      const sv = input.stickVec;
      if (sv.mag > 0.08) {
        mx += sv.x;
        mz += sv.y;
      }
      const len = Math.hypot(mx, mz);
      const running =
        k.has('ShiftLeft') || k.has('ShiftRight') || sv.mag > 0.88;
      if (len > 0.01) {
        const speed = (running ? 4.6 : 2.9) * dt;
        const nx = mx / Math.max(1, len);
        const nz = mz / Math.max(1, len);
        const sin = Math.sin(input.yaw);
        const cos = Math.cos(input.yaw);
        // Camera forward is -Z rotated by yaw; right is +X rotated.
        const wx = (-sin * nz + cos * nx) * speed;
        const wz = (-cos * nz - sin * nx) * speed;
        const p = input.pos;
        if (!collides(p.x + wx, p.z, input.ground)) p.x += wx;
        if (!collides(p.x, p.z + wz, input.ground)) p.z += wz;
      }

      // Doors: swing toward open when the walker is close, shut when
      // they have walked away. Smoothstepped so they swing, not snap.
      // A locked door never opens to approach from OUTSIDE; from the
      // inside it opens as normal (and stays locked until twisted off).
      let nearest: DoorLeaf | null = null;
      let nearestD = Infinity;
      let nearestInside = false;
      for (const leaf of leaves) {
        const d = Math.hypot(input.pos.x - leaf.cx, input.pos.z - leaf.cz);
        const off = leaf.axis === 'x' ? input.pos.x - leaf.cx : input.pos.z - leaf.cz;
        const isInside = off === 0 || Math.sign(off) === leaf.insideSign;
        const target = d < 1.35 && (!leaf.locked || isInside) ? 1 : 0;
        const step = dt * 2.4;
        leaf.open01 += Math.max(-step, Math.min(step, target - leaf.open01));
        const o = leaf.open01;
        leaf.pivot.rotation.y = leaf.openAngle * (o * o * (3 - 2 * o));
        if (d < nearestD) {
          nearest = leaf;
          nearestD = d;
          nearestInside = isInside;
        }
      }
      // The lock button / hint follows the nearest door.
      const note =
        nearest && nearestD < 1.3
          ? nearest.locked
            ? nearestInside
              ? 'Unlock door'
              : 'Locked'
            : nearestInside
              ? 'Lock door'
              : null
          : null;
      if (note !== lastDoorNote) {
        lastDoorNote = note;
        setDoorNote(note);
      }

      input.ground = groundHeightAt(input.pos.x, input.pos.z, input.ground);
      input.pos.y = input.ground;
      camera.position.set(input.pos.x, input.ground + EYE, input.pos.z);
      camera.rotation.set(input.pitch, input.yaw, 0);

      const room = roomAt(input.pos.x, input.pos.z, input.ground);
      const label = room ? room.name : 'Outside';
      if (label !== lastRoom) {
        lastRoom = label;
        setRoomName(label);
      }

      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const onResize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
      window.removeEventListener('keydown', onLockKey);
      document.removeEventListener('mousemove', onMouseMove);
      renderer.domElement.removeEventListener('click', onCanvasClick);
      if (document.pointerLockElement === renderer.domElement) document.exitPointerLock();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, []);

  // ---- Touch layer: joystick (left) + drag-look (everywhere else) ----
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType !== 'touch') return;
    setIsTouch(true);
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (x < rect.width * 0.45 && y > rect.height * 0.35 && stickPointerRef.current === null) {
      stickPointerRef.current = e.pointerId;
      stickOriginRef.current = { x, y };
      setStick({ ox: x, oy: y, dx: 0, dy: 0 });
    } else if (lookPointerRef.current === null) {
      lookPointerRef.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
    }
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (e.pointerType !== 'touch') return;
    if (stickPointerRef.current === e.pointerId) {
      const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      let dx = x - stickOriginRef.current.x;
      let dy = y - stickOriginRef.current.y;
      const mag = Math.hypot(dx, dy);
      const max = 55;
      if (mag > max) {
        dx = (dx / mag) * max;
        dy = (dy / mag) * max;
      }
      setStick({ ox: stickOriginRef.current.x, oy: stickOriginRef.current.y, dx, dy });
      const input = inputRef.current;
      input.stickVec = {
        x: dx / max,
        y: -dy / max,
        mag: Math.min(1, mag / max),
      };
    } else if (lookPointerRef.current?.id === e.pointerId) {
      const input = inputRef.current;
      const dx = e.clientX - lookPointerRef.current.x;
      const dy = e.clientY - lookPointerRef.current.y;
      lookPointerRef.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
      input.yaw -= dx * 0.0042;
      input.pitch = Math.max(-1.35, Math.min(1.35, input.pitch - dy * 0.0042));
    }
  };
  const onPointerEnd = (e: React.PointerEvent) => {
    if (stickPointerRef.current === e.pointerId) {
      stickPointerRef.current = null;
      setStick(null);
      inputRef.current.stickVec = { x: 0, y: 0, mag: 0 };
    }
    if (lookPointerRef.current?.id === e.pointerId) lookPointerRef.current = null;
  };

  return (
    <div
      style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', touchAction: 'none' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
    >
      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />

      {/* Crosshair */}
      <div
        style={{
          position: 'absolute', left: '50%', top: '50%',
          width: 5, height: 5, marginLeft: -2.5, marginTop: -2.5,
          borderRadius: '50%', background: 'rgba(232,228,218,0.75)', pointerEvents: 'none',
        }}
      />

      {/* Room / floor HUD */}
      <div
        style={{
          position: 'absolute', left: 12, top: 12, pointerEvents: 'none',
          padding: '0.4rem 0.75rem', background: 'rgba(10,10,12,0.66)',
          fontSize: '0.95rem', letterSpacing: '0.06em',
        }}
      >
        {roomName}
      </div>
      <div
        style={{
          position: 'absolute', right: 12, bottom: 12, pointerEvents: 'none',
          padding: '0.35rem 0.7rem', background: 'rgba(10,10,12,0.55)',
          fontSize: '0.8rem', opacity: 0.85, textAlign: 'right',
        }}
      >
        {isTouch ? 'Left thumb: move · drag: look' : 'Click: look · WASD: move · Shift: run · E: lock / unlock'}
      </div>

      {/* Door lock: a real button on touch; a plain notice when the
          door you face is locked from the other side. */}
      {doorNote === 'Lock door' || doorNote === 'Unlock door' ? (
        <button
          onClick={() => lockActionRef.current?.()}
          style={{
            position: 'absolute', right: 12, bottom: 64, minHeight: 48, minWidth: 48,
            padding: '0.5rem 1rem', background: 'rgba(20,18,14,0.85)', color: '#e8e4da',
            border: '1px solid rgba(232,228,218,0.4)', fontSize: '0.95rem', letterSpacing: '0.04em',
          }}
        >
          {doorNote === 'Lock door' ? '\uD83D\uDD12 Lock' : '\uD83D\uDD13 Unlock'}
        </button>
      ) : doorNote === 'Locked' ? (
        <div
          style={{
            position: 'absolute', right: 12, bottom: 64, pointerEvents: 'none',
            padding: '0.5rem 1rem', background: 'rgba(20,18,14,0.85)',
            fontSize: '0.95rem', letterSpacing: '0.04em', opacity: 0.9,
          }}
        >
          \uD83D\uDD12 Locked
        </div>
      ) : null}

      {/* Virtual joystick */}
      {stick && (
        <>
          <div
            style={{
              position: 'absolute', left: stick.ox - 60, top: stick.oy - 60,
              width: 120, height: 120, borderRadius: '50%',
              border: '2px solid rgba(232,228,218,0.35)',
              background: 'rgba(20,20,24,0.3)', pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'absolute', left: stick.ox + stick.dx - 27, top: stick.oy + stick.dy - 27,
              width: 54, height: 54, borderRadius: '50%',
              background: 'rgba(232,228,218,0.45)', pointerEvents: 'none',
            }}
          />
        </>
      )}
    </div>
  );
}
