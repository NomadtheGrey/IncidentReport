import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// First-person walkthrough of Adam's Blockbench model (AllFloors.gltf),
// loaded as the house itself — the pipeline the hand-translated build
// could never keep up with. What you see is what you walk on: ground
// height and wall collision are extracted from the model's own
// triangles after it is placed in game coordinates.
//
// Placement: Adam models at 1 grid unit = 1 m; Blockbench's glTF
// export divides by 16, so the loader scales x16 back. His axes
// (+x = his north, +z = his east) map to ours as
//   gameX = hisZ,  gameY = hisY,  gameZ = hisX + 0.5
// (the same rotation house.ts documents, no mirroring of the plan).
// His re-based file has y=0 at the main floor's slab bottom: basement
// floor -2.4, main walking surface +0.1, upstairs floor 2.5.
//
// Load-time correction (flagged to Adam 2026-11-11): the model's
// lane-separator boxes run the full 6 m of the shaft, straight across
// both half-landings — as drawn, the switchback turn is sealed (a
// ~1.1 m wall stands across each landing). A real spine ends where
// the flights end. Collision for separator triangles in the landing
// band is clamped to the flights' end (x = 3.95) so the turn is open;
// the model still RENDERS as drawn. If the spine is trimmed in
// Blockbench, the clamp becomes a no-op.
//
// Doors: his model has framed openings but no leaves. Leaves are hung
// here from Models' measured door schedule (2026-11-11) — positions
// cross-checked against the doorway frames in the file itself. The
// stair-head doorway is framed in the model but stays open, as the
// game has always treated the upstairs arrival. Exterior doors are
// not cut in the model yet, so there are no leaves for them either.

const EYE = 1.62;
const RADIUS = 0.22;
const BODY_H = 1.6; // collision height: the model's tightest stair
// headroom (crossing under the closet wall's lower edge on the north
// lane) is ~1.7 m — a 1.75 body snagged on a wall that only clips the
// top of the band; 1.6 walks it the way a person ducking would.
const STEP_UP = 0.55; // a tread riser is 0.2; a wall is 2.4
const SNAP_DOWN = 1.2; // never teleport-fall further than this
const DOOR_H = 2.3; // Adam's standard opening height in the model

// ---- Door schedule (game coordinates, metres) -------------------------
// wallAxis 'x': the wall plane is x = cx, the leaf spans z.
// wallAxis 'z': the wall plane is z = cz, the leaf spans x.
// insideSign: direction along the wall-normal axis from the doorway
// toward the room the door locks FROM (privacy lock side).
interface ModelDoor {
  id: string;
  cx: number;
  cz: number;
  floorY: number;
  width: number;
  wallAxis: 'x' | 'z';
  insideSign: number;
}

const MODEL_DOORS: ModelDoor[] = [
  // Upstairs (walking surface 2.6 — the slab top; the leaves used to
  // hang at 2.5 and sank 0.1 into the floor, their bottom edges
  // landing in the ceiling plane of the rooms below), openings 0.8.
  { id: 'clarissa', cx: -1.07, cz: -0.89, floorY: 2.6, width: 0.8, wallAxis: 'x', insideSign: -1 },
  { id: 'breanna', cx: -1.07, cz: 0.0, floorY: 2.6, width: 0.8, wallAxis: 'x', insideSign: -1 },
  { id: 'bathroom', cx: 0.5, cz: -1.5, floorY: 2.6, width: 0.8, wallAxis: 'z', insideSign: -1 },
  { id: 'darleen', cx: 0.5, cz: 0.5, floorY: 2.6, width: 0.8, wallAxis: 'z', insideSign: 1 },
  { id: 'darleens-closet', cx: 2.58, cz: 0.5, floorY: 2.6, width: 0.8, wallAxis: 'z', insideSign: -1 },
  // Main floor: NO leaf in the hall<->stairwell opening — Adam's pin
  // (2026-11-12): that doorway stays open. The leaf that used to hang
  // here could also bar the only route to the basement stairs.
  // Basement (floor -2.4). The walled-off room's door, 1.0 wide.
  { id: 'basement-room', cx: -1.1, cz: 3.0, floorY: -2.4, width: 1.0, wallAxis: 'x', insideSign: -1 },
];

// ---- HUD zones (the model's plan, game coordinates) -------------------
interface Zone {
  name: string;
  y: number;
  x: [number, number];
  z: [number, number];
}

const ZONES: Zone[] = [
  { name: "Clarissa's Room", y: 2.5, x: [-6, -1], z: [-4.5, -0.5] },
  { name: "Breanna's Room", y: 2.5, x: [-6, -1], z: [-0.5, 4.5] },
  { name: 'Hall', y: 2.5, x: [-1, 1], z: [-1.5, 0.5] },
  { name: "Darleen's Closet", y: 2.5, x: [2, 3], z: [-0.5, 0.5] },
  { name: 'Hall Closet', y: 2.5, x: [1, 2], z: [-0.5, 0.5] },
  { name: 'Stairs', y: 2.5, x: [1, 6], z: [-1.5, 0.5] },
  { name: 'Bathroom', y: 2.5, x: [-1, 6], z: [-4.5, -1.5] },
  { name: "Darleen's Room", y: 2.5, x: [-1, 6], z: [0.5, 4.5] },
  { name: 'Kitchen', y: 0.1, x: [-6, -1], z: [-4.5, 0.5] },
  { name: 'Living Room', y: 0.1, x: [-6, -1], z: [0.5, 4.5] },
  { name: 'Hall / Entry', y: 0.1, x: [-1, 1], z: [-4.5, 4.5] },
  { name: 'Stairs', y: 0.1, x: [1, 6], z: [-1.5, 0.5] },
  { name: 'Mudroom / Laundry', y: 0.1, x: [1, 6], z: [-4.5, -1.5] },
  { name: 'Dining Room', y: 0.1, x: [1, 6], z: [0.5, 4.5] },
  { name: 'Basement Room', y: -2.4, x: [-6, -1.1], z: [0.5, 4.5] },
  { name: 'Basement', y: -2.4, x: [-6, 6], z: [-4.5, 4.5] },
];

function zoneAt(x: number, z: number, ground: number): string {
  let best: Zone | null = null;
  let bestDist = Infinity;
  let bestArea = Infinity;
  for (const zn of ZONES) {
    if (x < zn.x[0] || x > zn.x[1] || z < zn.z[0] || z > zn.z[1]) continue;
    const dist = Math.abs(zn.y - ground);
    const area = (zn.x[1] - zn.x[0]) * (zn.z[1] - zn.z[0]);
    if (dist < bestDist || (dist === bestDist && area < bestArea)) {
      bestDist = dist;
      bestArea = area;
      best = zn;
    }
  }
  return best ? best.name : 'Outside';
}

// ---- Triangle walking geometry ----------------------------------------
interface Tri {
  ax: number; ay: number; az: number;
  bx: number; by: number; bz: number;
  cx: number; cy: number; cz: number;
  minX: number; maxX: number; minZ: number; maxZ: number;
  minY: number; maxY: number;
  ny: number;
}

// ---- Furniture: Models chat's trappings batch 1, placed 2026-11-12 ----
// Pieces are the Models chat's .gltf exports (same convention as the
// house: values are metres / 16, scale 16 restores them). Each piece
// is built on the floor with its back at local z = 0 and its front
// toward +z; lc = the piece's local centre in FILE units, w/d/h its
// size in metres. Placement is by centre: yaw turns the piece, the
// collider is the yaw-aligned footprint (all yaws are multiples of
// 90°, so the footprint stays axis-aligned). floorY = 2.6 (upstairs
// slab top) for every piece in this batch — bathroom + bedrooms.
// Backs sit at the MEASURED wall faces, not the room boundary lines:
// most walls are built 0.1 into the room (bathroom's south face is at
// gz −4.4, not −4.5), and an earlier placement on the boundary lines
// sank pieces 0.1 into the walls — the 0.03-thick mirror vanished
// entirely and the tub lost its back rim into the wall (Adam's
// playtest, 2026-11-12). Clarissa's dresser is the exception: that
// wall extends the other way, so its back was already flush.
interface FurnitureSpec {
  file: string;
  lc: [number, number];
  w: number; d: number; h: number;
  cx: number; cz: number; yaw: number;
  box: boolean;
  y?: number; // floor height the piece stands on (default FURN_Y)
  lean?: number; // radians of forward tilt after yaw (wall-leaning props)
}

const FURN_Y = 2.6;
const FURNITURE: FurnitureSpec[] = [
  // Bathroom — fixtures along the south wall (face gz −4.4), fronts north.
  { file: 'vanity', lc: [0.028, 0.017], w: 0.93, d: 0.57, h: 1.06, cx: 0.62, cz: -4.115, yaw: 0, box: true },
  { file: 'mirror', lc: [0.0255, 0.001], w: 0.82, d: 0.03, h: 0, cx: 0.62, cz: -4.385, yaw: 0, box: false },
  { file: 'toilet', lc: [0.0155, 0.021], w: 0.53, d: 0.70, h: 0.83, cx: 1.62, cz: -4.05, yaw: 0, box: true },
  { file: 'bathtub', lc: [0.053, 0.0235], w: 1.70, d: 0.75, h: 0.75, cx: 3.85, cz: -4.025, yaw: 0, box: true },
  // Darleen's Room — king against the north wall (face 4.4), dresser east (face 5.9).
  { file: 'bed-king', lc: [0.062, 0.068], w: 1.98, d: 2.18, h: 1.10, cx: 2.0, cz: 3.31, yaw: Math.PI, box: true },
  { file: 'nightstand', lc: [0.0175, 0.014], w: 0.59, d: 0.48, h: 0.61, cx: 0.72, cz: 4.16, yaw: Math.PI, box: true },
  { file: 'nightstand', lc: [0.0175, 0.014], w: 0.59, d: 0.48, h: 0.61, cx: 3.28, cz: 4.16, yaw: Math.PI, box: true },
  { file: 'dresser', lc: [0.0465, 0.0155], w: 1.52, d: 0.52, h: 0.90, cx: 5.64, cz: 2.2, yaw: -Math.PI / 2, box: true },
  // Clarissa's Room — full bed + nightstand on the south wall (face −4.4), dresser north (already flush).
  { file: 'bed-full', lc: [0.0445, 0.0645], w: 1.42, d: 2.06, h: 0.99, cx: -3.89, cz: -3.37, yaw: 0, box: true },
  { file: 'nightstand', lc: [0.0175, 0.014], w: 0.59, d: 0.48, h: 0.61, cx: -2.8, cz: -4.16, yaw: 0, box: true },
  { file: 'dresser', lc: [0.0465, 0.0155], w: 1.52, d: 0.52, h: 0.90, cx: -3.6, cz: -0.76, yaw: Math.PI, box: true },
  // Breanna's Room — full bed on the west wall (face −5.9), dresser on the south (face −0.4).
  { file: 'bed-full', lc: [0.0445, 0.0645], w: 1.42, d: 2.06, h: 0.99, cx: -4.87, cz: 1.7, yaw: Math.PI / 2, box: true },
  { file: 'nightstand', lc: [0.0175, 0.014], w: 0.59, d: 0.48, h: 0.61, cx: -5.66, cz: 2.85, yaw: Math.PI / 2, box: true },
  { file: 'dresser', lc: [0.0465, 0.0155], w: 1.52, d: 0.52, h: 0.90, cx: -3.9, cz: -0.14, yaw: 0, box: true },
  // ---- Main floor (y = 0.1), placed on Adam's *Loc markers
  // (Models batch, 2026-11-12). Centres are the markers, except
  // backed pieces, whose backs sit on the measured wall faces.
  // Dining (west room): table on its 3.0 x 1.5 marker plate, eight
  // chairs ringed on their markers, facing the table.
  { file: 'dining-table', lc: [0, 0], w: 3.0, d: 1.5, h: 0.76, cx: -3.6, cz: -2.25, yaw: 0, box: true, y: 0.1 },
  { file: 'dining-chair', lc: [0, 0.01405], w: 0.45, d: 0.45, h: 0.95, cx: -2.45, cz: -3.15, yaw: 0, box: true, y: 0.1 },
  { file: 'dining-chair', lc: [0, 0.01405], w: 0.45, d: 0.45, h: 0.95, cx: -3.45, cz: -3.15, yaw: 0, box: true, y: 0.1 },
  { file: 'dining-chair', lc: [0, 0.01405], w: 0.45, d: 0.45, h: 0.95, cx: -4.45, cz: -3.15, yaw: 0, box: true, y: 0.1 },
  { file: 'dining-chair', lc: [0, 0.01405], w: 0.45, d: 0.45, h: 0.95, cx: -2.45, cz: -1.35, yaw: Math.PI, box: true, y: 0.1 },
  { file: 'dining-chair', lc: [0, 0.01405], w: 0.45, d: 0.45, h: 0.95, cx: -3.45, cz: -1.35, yaw: Math.PI, box: true, y: 0.1 },
  { file: 'dining-chair', lc: [0, 0.01405], w: 0.45, d: 0.45, h: 0.95, cx: -4.45, cz: -1.35, yaw: Math.PI, box: true, y: 0.1 },
  { file: 'dining-chair', lc: [0, 0.01405], w: 0.45, d: 0.45, h: 0.95, cx: -5.25, cz: -2.25, yaw: Math.PI / 2, box: true, y: 0.1 },
  { file: 'dining-chair', lc: [0, 0.01405], w: 0.45, d: 0.45, h: 0.95, cx: -1.95, cz: -2.25, yaw: -Math.PI / 2, box: true, y: 0.1 },
  // Living: 3-seat couch back on the west wall face (-5.9), 2-seat
  // back on the north wall face (4.4), entertainment center between
  // them facing the 2-seat; curio back on the hall spine (face 0).
  { file: 'couch-3seat', lc: [0, 0.0297], w: 2.3, d: 0.95, h: 0.92, cx: -5.425, cz: 2.55, yaw: Math.PI / 2, box: true, y: 0.1 },
  { file: 'couch-2seat', lc: [0, 0.0297], w: 1.7, d: 0.95, h: 0.92, cx: -1.45, cz: 3.925, yaw: Math.PI, box: true, y: 0.1 },
  { file: 'entertainment-center', lc: [0, 0.01515], w: 1.94, d: 0.49, h: 1.46, cx: -1.45, cz: 0.65, yaw: 0, box: true, y: 0.1 },
  { file: 'curio-cabinet', lc: [0, 0.0119], w: 0.9, d: 0.4, h: 1.96, cx: -0.2, cz: -2.95, yaw: -Math.PI / 2, box: true, y: 0.1 },
  // The floor lamp (Adam remembered it after the batch): in the
  // corner at the 3-seat couch's north end. The extension cord's
  // home is plugged into this lamp (item logic comes later).
  { file: 'floor-lamp', lc: [0, 0], w: 0.36, d: 0.36, h: 1.62, cx: -5.55, cz: 4.05, yaw: 0, box: true, y: 0.1 },
  // Kitchen (east room): base runs on the south wall face (-4.4)
  // and the east wall face (5.9), wall cabinets above them (their
  // height is baked into the files; no colliders, like the mirror).
  // The south run's west-end module is the junk drawer.
  { file: 'kitchen-run-south', lc: [0.13125, 0.0203], w: 4.24, d: 0.65, h: 0.905, cx: 3.25, cz: -4.075, yaw: 0, box: true, y: 0.1 },
  { file: 'kitchen-wall-south', lc: [0.10315, 0.01195], w: 3.32, d: 0.38, h: 0, cx: 2.79, cz: -4.21, yaw: 0, box: false, y: 0.1 },
  { file: 'kitchen-run-east', lc: [0.13285, 0.0194], w: 4.29, d: 0.62, h: 1.16, cx: 5.59, cz: -2.255, yaw: -Math.PI / 2, box: true, y: 0.1 },
  { file: 'kitchen-wall-east', lc: [0.19375, 0.01195], w: 2.12, d: 0.38, h: 0, cx: 5.71, cz: -1.28, yaw: -Math.PI / 2, box: false, y: 0.1 },
  // ---- The day-one items (objects batch), in their pinned or
  // sensible places (Adam, 2026-11-12: "add more stuff"). Small
  // props carry no colliders — you brush past a skillet.
  // Kitchen: skillet + pot on the south counter (top y 1.01),
  // hammer in the ajar junk drawer, tape beside it, extinguisher
  // standing at the run's end.
  { file: 'skillet', lc: [0, 0.00525], w: 0.35, d: 0.51, h: 0.06, cx: 2.6, cz: -4.09, yaw: 0.5, box: false, y: 1.01 },
  { file: 'pot', lc: [0, 0], w: 0.35, d: 0.32, h: 0.27, cx: 3.15, cz: -4.09, yaw: 0, box: false, y: 1.01 },
  { file: 'claw-hammer', lc: [0, 0.01015], w: 0.05, d: 0.33, h: 0.07, cx: 1.43, cz: -3.68, yaw: Math.PI / 2, box: false, y: 0.62 },
  { file: 'duct-tape', lc: [0, 0.003], w: 0.15, d: 0.24, h: 0.05, cx: 1.9, cz: -4.09, yaw: 0.4, box: false, y: 1.01 },
  { file: 'fire-extinguisher', lc: [0, 0], w: 0.18, d: 0.16, h: 0.51, cx: 5.0, cz: -3.85, yaw: 0, box: true, y: 0.1 },
  // Living/dining: the cord coiled at its lamp's base, ashtray on
  // the dining table, poker set down by the entertainment center.
  { file: 'extension-cord', lc: [0, 0], w: 0.35, d: 0.31, h: 0.06, cx: -5.05, cz: 4.05, yaw: 0, box: false, y: 0.1 },
  { file: 'ashtray', lc: [0, 0], w: 0.13, d: 0.13, h: 0.05, cx: -4.7, cz: -2.6, yaw: 0, box: false, y: 0.86 },
  { file: 'poker', lc: [0, 0.0206], w: 0.03, d: 0.98, h: 0.03, cx: -1.45, cz: 1.15, yaw: Math.PI / 2, box: false, y: 0.1 },
  // Upstairs: phone on Darleen's nightstand (top 3.21), iron on
  // her dresser (top 3.50), the bat on the floor beside her bed,
  // plunger by the toilet.
  { file: 'phone', lc: [0, 0], w: 0.08, d: 0.21, h: 0.06, cx: 0.72, cz: 4.16, yaw: 0, box: false, y: 3.21 },
  { file: 'clothes-iron', lc: [0, 0.0017], w: 0.12, d: 0.36, h: 0.15, cx: 5.64, cz: 2.2, yaw: -Math.PI / 2, box: false, y: 3.5 },
  { file: 'baseball-bat', lc: [0, 0.02535], w: 0.36, d: 0.91, h: 0.07, cx: 3.18, cz: 3.2, yaw: 0, box: false, y: 2.6 },
  { file: 'plunger', lc: [0, 0], w: 0.16, d: 0.16, h: 0.58, cx: 2.05, cz: -4.15, yaw: 0, box: false, y: 2.6 },
  // The shovel hangs in the basement stairs (Adam's pin): leaning
  // on the landing's east wall, handle up.
  { file: 'shovel', lc: [0, 0.0325], w: 0.22, d: 1.3, h: 0.07, cx: 5.48, cz: -1.0, yaw: Math.PI / 2, box: false, y: -1.1, lean: -1.31 },
];

function extractTris(
  root: THREE.Object3D,
  skip?: Set<THREE.Object3D>,
): { floors: Tri[]; walls: Tri[] } {
  const floors: Tri[] = [];
  const walls: Tri[] = [];
  root.updateMatrixWorld(true);
  const va = new THREE.Vector3();
  const vb = new THREE.Vector3();
  const vc = new THREE.Vector3();
  const ab = new THREE.Vector3();
  const ac = new THREE.Vector3();
  const n = new THREE.Vector3();
  root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    if (skip?.has(obj)) return;
    const geo = obj.geometry as THREE.BufferGeometry;
    const pos = geo.getAttribute('position');
    if (!pos) return;
    const index = geo.getIndex();
    const count = index ? index.count : pos.count;
    const m = obj.matrixWorld;
    for (let i = 0; i + 2 < count; i += 3) {
      const i0 = index ? index.getX(i) : i;
      const i1 = index ? index.getX(i + 1) : i + 1;
      const i2 = index ? index.getX(i + 2) : i + 2;
      va.fromBufferAttribute(pos, i0).applyMatrix4(m);
      vb.fromBufferAttribute(pos, i1).applyMatrix4(m);
      vc.fromBufferAttribute(pos, i2).applyMatrix4(m);
      ab.subVectors(vb, va);
      ac.subVectors(vc, va);
      n.crossVectors(ab, ac);
      const len = n.length();
      if (len < 1e-10) continue;
      const ny = Math.abs(n.y / len); // winding flips under the axis swap; magnitude is the signal
      const tri: Tri = {
        ax: va.x, ay: va.y, az: va.z,
        bx: vb.x, by: vb.y, bz: vb.z,
        cx: vc.x, cy: vc.y, cz: vc.z,
        minX: Math.min(va.x, vb.x, vc.x), maxX: Math.max(va.x, vb.x, vc.x),
        minZ: Math.min(va.z, vb.z, vc.z), maxZ: Math.max(va.z, vb.z, vc.z),
        minY: Math.min(va.y, vb.y, vc.y), maxY: Math.max(va.y, vb.y, vc.y),
        ny,
      };
      if (ny > 0.5) {
        floors.push(tri);
      } else {
        // Separator-clamp (see header): a wall tri in the separator
        // band (z within [-0.68, -0.22]) that overlaps a landing's
        // height band and reaches past the flights' end gets its
        // collision footprint clamped to x = 3.95, opening the turn.
        const sepBand = tri.minZ >= -0.68 && tri.maxZ <= -0.22;
        const landingBand =
          (tri.minY <= 2.6 && tri.maxY >= 1.3) || (tri.minY <= 0.1 && tri.maxY >= -1.2);
        if (sepBand && landingBand && tri.maxX > 4.05) {
          tri.ax = Math.min(tri.ax, 3.95);
          tri.bx = Math.min(tri.bx, 3.95);
          tri.cx = Math.min(tri.cx, 3.95);
          tri.minX = Math.min(tri.ax, tri.bx, tri.cx);
          tri.maxX = Math.max(tri.ax, tri.bx, tri.cx);
        }
        walls.push(tri);
      }
    }
  });
  return { floors, walls };
}

/** Height of a floor triangle's surface over a plan point, or null. */
function triHeightAt(t: Tri, x: number, z: number): number | null {
  const d = (t.bz - t.cz) * (t.ax - t.cx) + (t.cx - t.bx) * (t.az - t.cz);
  if (Math.abs(d) < 1e-9) return null;
  const w0 = ((t.bz - t.cz) * (x - t.cx) + (t.cx - t.bx) * (z - t.cz)) / d;
  const w1 = ((t.cz - t.az) * (x - t.cx) + (t.ax - t.cx) * (z - t.cz)) / d;
  const w2 = 1 - w0 - w1;
  if (w0 < -1e-6 || w1 < -1e-6 || w2 < -1e-6) return null;
  return w0 * t.ay + w1 * t.by + w2 * t.cy;
}

/** 2D distance from a point to a (possibly degenerate) triangle. */
function distToTri2D(t: Tri, x: number, z: number): number {
  // Inside? Barycentric sign test in XZ.
  const d = (t.bz - t.cz) * (t.ax - t.cx) + (t.cx - t.bx) * (t.az - t.cz);
  if (Math.abs(d) > 1e-9) {
    const w0 = ((t.bz - t.cz) * (x - t.cx) + (t.cx - t.bx) * (z - t.cz)) / d;
    const w1 = ((t.cz - t.az) * (x - t.cx) + (t.ax - t.cx) * (z - t.cz)) / d;
    if (w0 >= 0 && w1 >= 0 && w0 + w1 <= 1) return 0;
  }
  const seg = (x1: number, z1: number, x2: number, z2: number) => {
    const dx = x2 - x1;
    const dz = z2 - z1;
    const l2 = dx * dx + dz * dz;
    const s = l2 < 1e-12 ? 0 : Math.max(0, Math.min(1, ((x - x1) * dx + (z - z1) * dz) / l2));
    return Math.hypot(x - (x1 + s * dx), z - (z1 + s * dz));
  };
  return Math.min(
    seg(t.ax, t.az, t.bx, t.bz),
    seg(t.bx, t.bz, t.cx, t.cz),
    seg(t.cx, t.cz, t.ax, t.az),
  );
}

// ---- Door leaves --------------------------------------------------------
interface Leaf {
  spec: ModelDoor;
  pivot: THREE.Group;
  openAngle: number;
  open01: number;
  locked: boolean;
}

interface Box {
  minX: number; maxX: number; minZ: number; maxZ: number;
  minY: number; maxY: number; doorIdx?: number;
}

export default function ModelWalk() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [roomName, setRoomName] = useState("Darleen's Room");
  const [doorNote, setDoorNote] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const lockActionRef = useRef<(() => void) | null>(null);
  const [isTouch, setIsTouch] = useState(false);
  const [stick, setStick] = useState<{ ox: number; oy: number; dx: number; dy: number } | null>(null);

  const inputRef = useRef({
    keys: new Set<string>(),
    yaw: -Math.PI / 2, // face east, toward Darleen's door
    pitch: 0,
    stickVec: { x: 0, y: 0, mag: 0 },
    pos: new THREE.Vector3(4.6, 2.5, 1.6),
    ground: 2.5,
  });
  const stickPointerRef = useRef<number | null>(null);
  const stickOriginRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const lookPointerRef = useRef<{ id: number; x: number; y: number } | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const input = inputRef.current;
    let disposed = false;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x07080c);
    scene.fog = new THREE.Fog(0x07080c, 30, 80);

    const camera = new THREE.PerspectiveCamera(72, mount.clientWidth / mount.clientHeight, 0.05, 120);
    camera.rotation.order = 'YXZ';

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.domElement.style.touchAction = 'none';
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xdfe8ff, 0x2a241d, 0.95));
    const moon = new THREE.DirectionalLight(0xafc4ff, 0.7);
    moon.position.set(-12, 20, 10);
    scene.add(moon);
    for (const [x, y, z] of [
      [-3, 2.3, 0], [3.5, 2.3, -3], [3.2, 2.2, -0.5], // main floor + its shaft top
      [0.7, 4.8, 2], [-3.5, 4.8, 0], [3, 4.8, -3], // upstairs
    ] as const) {
      const p = new THREE.PointLight(0xffd9a0, 12, 11, 1.8);
      p.position.set(x, y, z);
      scene.add(p);
    }
    // Basement, brighter and with its own shaft light: the sealed
    // stair enclosure admitted almost no light (the flights read
    // near-black) and Adam could not see the basement floor at all
    // (playtest, 2026-11-12).
    for (const [x, y, z] of [
      [0, -0.4, 0], [-3.5, -0.4, 2.5], // hall side + basement room
      [3.2, -0.5, -0.5], // inside the stair shaft, over the landing
      [3.5, -0.5, -2.5], // open basement, east side
    ] as const) {
      const p = new THREE.PointLight(0xffd9a0, 20, 13, 1.8);
      p.position.set(x, y, z);
      scene.add(p);
    }

    // The yard at grade (his y=0 is the ground outside).
    const groundDisc = new THREE.Mesh(
      new THREE.CircleGeometry(45, 40),
      new THREE.MeshStandardMaterial({ color: 0x1d241c, roughness: 1 }),
    );
    groundDisc.rotation.x = -Math.PI / 2;
    groundDisc.position.y = -0.02;
    scene.add(groundDisc);

    let floors: Tri[] = [];
    let walls: Tri[] = [];
    const boxes: Box[] = [];
    const leaves: Leaf[] = [];

    const meshGround = (x: number, z: number, current: number): number => {
      let best: number | null = null;
      for (const t of floors) {
        if (x < t.minX || x > t.maxX || z < t.minZ || z > t.maxZ) continue;
        const y = triHeightAt(t, x, z);
        if (y === null) continue;
        if (y > current + STEP_UP || y < current - SNAP_DOWN) continue;
        if (best === null || y > best) best = y;
      }
      return best ?? current;
    };

    const collides = (x: number, z: number, ground: number): boolean => {
      const bodyLo = ground + 0.05;
      const bodyHi = ground + BODY_H;
      for (const b of boxes) {
        if (b.doorIdx !== undefined && leaves[b.doorIdx].open01 > 0.45) continue;
        if (bodyHi < b.minY || bodyLo > b.maxY) continue;
        const nx = Math.max(b.minX, Math.min(x, b.maxX));
        const nz = Math.max(b.minZ, Math.min(z, b.maxZ));
        const dx = x - nx;
        const dz = z - nz;
        if (dx * dx + dz * dz < RADIUS * RADIUS) return true;
      }
      for (const t of walls) {
        // A step riser (0.2) never blocks; a real wall (2.4) does.
        if (t.maxY <= ground + STEP_UP || t.minY >= bodyHi) continue;
        if (x < t.minX - RADIUS || x > t.maxX + RADIUS || z < t.minZ - RADIUS || z > t.maxZ + RADIUS) continue;
        if (distToTri2D(t, x, z) < RADIUS) return true;
      }
      return false;
    };

    const buildLeaves = () => {
      const doorMat = new THREE.MeshStandardMaterial({ color: 0x6e4f2e, roughness: 0.85 });
      for (const spec of MODEL_DOORS) {
        const pivot = new THREE.Group();
        let leafMesh: THREE.Mesh;
        let openAngle: number;
        if (spec.wallAxis === 'x') {
          pivot.position.set(spec.cx, spec.floorY, spec.cz - spec.width / 2);
          leafMesh = new THREE.Mesh(new THREE.BoxGeometry(0.05, DOOR_H, spec.width), doorMat);
          leafMesh.position.set(0, DOOR_H / 2, spec.width / 2);
          openAngle = spec.insideSign * 1.75;
        } else {
          pivot.position.set(spec.cx - spec.width / 2, spec.floorY, spec.cz);
          leafMesh = new THREE.Mesh(new THREE.BoxGeometry(spec.width, DOOR_H, 0.05), doorMat);
          leafMesh.position.set(spec.width / 2, DOOR_H / 2, 0);
          openAngle = -spec.insideSign * 1.75;
        }
        pivot.add(leafMesh);
        scene.add(pivot);
        const idx = leaves.length;
        leaves.push({ spec, pivot, openAngle, open01: 0, locked: false });
        boxes.push(
          spec.wallAxis === 'x'
            ? {
                minX: spec.cx - 0.09, maxX: spec.cx + 0.09,
                minZ: spec.cz - spec.width / 2, maxZ: spec.cz + spec.width / 2,
                minY: spec.floorY, maxY: spec.floorY + DOOR_H, doorIdx: idx,
              }
            : {
                minX: spec.cx - spec.width / 2, maxX: spec.cx + spec.width / 2,
                minZ: spec.cz - 0.09, maxZ: spec.cz + 0.09,
                minY: spec.floorY, maxY: spec.floorY + DOOR_H, doorIdx: idx,
              },
        );
      }
    };

    let raf = 0;
    let last = performance.now();
    let lastRoom = '';
    let lastDoorNote: string | null = null;

    const isInside = (leaf: Leaf): boolean => {
      const off = leaf.spec.wallAxis === 'x'
        ? input.pos.x - leaf.spec.cx
        : input.pos.z - leaf.spec.cz;
      return off === 0 || Math.sign(off) === leaf.spec.insideSign;
    };

    const toggleLock = () => {
      let best: Leaf | null = null;
      let bestD = Infinity;
      let bestInside = false;
      for (const leaf of leaves) {
        const d = Math.hypot(input.pos.x - leaf.spec.cx, input.pos.z - leaf.spec.cz);
        if (d < bestD) {
          best = leaf;
          bestD = d;
          bestInside = isInside(leaf);
        }
      }
      if (best && bestD < 1.3 && bestInside) best.locked = !best.locked;
    };
    lockActionRef.current = toggleLock;

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

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
      const running = k.has('ShiftLeft') || k.has('ShiftRight') || sv.mag > 0.88;
      if (len > 0.01) {
        const speed = (running ? 4.6 : 2.9) * dt;
        const nx = mx / Math.max(1, len);
        const nz = mz / Math.max(1, len);
        const sin = Math.sin(input.yaw);
        const cos = Math.cos(input.yaw);
        const wx = (-sin * nz + cos * nx) * speed;
        const wz = (-cos * nz - sin * nx) * speed;
        const p = input.pos;
        // The collision body stands on the LOWER of the current and
        // the stepped-to surface: stepping down a tread, your body
        // occupies the lower band, so a wall edge that only overhangs
        // the upper tread's headroom (the closet wall over the north
        // lane) does not block the step down past it.
        const stepBand = (nx: number, nz: number): number =>
          Math.min(input.ground, meshGround(nx, nz, input.ground));
        if (!collides(p.x + wx, p.z, stepBand(p.x + wx, p.z))) p.x += wx;
        if (!collides(p.x, p.z + wz, stepBand(p.x, p.z + wz))) p.z += wz;
      }

      let nearest: Leaf | null = null;
      let nearestD = Infinity;
      let nearestInside = false;
      for (const leaf of leaves) {
        const d = Math.hypot(input.pos.x - leaf.spec.cx, input.pos.z - leaf.spec.cz);
        const inside = isInside(leaf);
        const target = d < 1.35 && (!leaf.locked || inside) ? 1 : 0;
        const step = dt * 2.4;
        leaf.open01 += Math.max(-step, Math.min(step, target - leaf.open01));
        const o = leaf.open01;
        leaf.pivot.rotation.y = leaf.openAngle * (o * o * (3 - 2 * o));
        if (d < nearestD) {
          nearest = leaf;
          nearestD = d;
          nearestInside = inside;
        }
      }
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

      input.ground = meshGround(input.pos.x, input.pos.z, input.ground);
      input.pos.y = input.ground;
      camera.position.set(input.pos.x, input.ground + EYE, input.pos.z);
      camera.rotation.set(input.pitch, input.yaw, 0);

      const label = zoneAt(input.pos.x, input.pos.z, input.ground);
      if (label !== lastRoom) {
        lastRoom = label;
        setRoomName(label);
      }

      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };

    const onKey = (down: boolean) => (e: KeyboardEvent) => {
      if (down) input.keys.add(e.code);
      else input.keys.delete(e.code);
    };
    const kd = onKey(true);
    const ku = onKey(false);
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);
    const onLockKey = (e: KeyboardEvent) => {
      if (e.code === 'KeyE') toggleLock();
    };
    window.addEventListener('keydown', onLockKey);
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
    const onResize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener('resize', onResize);

    // ---- Load the model, place it, extract its walking geometry ----
    const loader = new GLTFLoader();
    loader
      .loadAsync(`${import.meta.env.BASE_URL}models/all-floors.gltf`)
      .then(async (gltf) => {
        if (disposed) return;
        const holder = new THREE.Group();
        // game = (hisZ, hisY, hisX + 0.5) at x16: scale first (with the
        // x-flip that makes the rotation come out right-handed in plan),
        // then rotate, then shift z by half a metre.
        holder.scale.set(-16, 16, 16);
        holder.rotation.y = Math.PI / 2;
        holder.position.set(0, 0, 0.5);
        holder.add(gltf.scene);
        scene.add(holder);
        // Adam's furniture location markers (the *Loc nodes under the
        // Locators group, added to the model 2026-11-12) are planning
        // aids, not house: hide them and keep them out of collision.
        const locators = new Set<THREE.Object3D>();
        gltf.scene.traverse((obj) => {
          if (obj.name === 'Locators' || obj.name.endsWith('Loc')) {
            obj.visible = false;
            obj.traverse((sub) => locators.add(sub));
          }
        });
        const tris = extractTris(holder, locators);
        floors = tris.floors;
        walls = tris.walls;
        buildLeaves();
        // Furniture: the pieces' own axes are already game-shaped
        // (x across, y up, z toward the front), so each one is just
        // scaled x16, centred on its placement, and yawed. A piece
        // that fails to load is skipped, never fatal.
        await Promise.all(
          FURNITURE.map(async (spec) => {
            try {
              const piece = await loader.loadAsync(
                `${import.meta.env.BASE_URL}models/furniture/${spec.file}.gltf`,
              );
              if (disposed) return;
              piece.scene.traverse((o) => {
                const mesh = o as THREE.Mesh;
                if (mesh.isMesh) {
                  const mat = mesh.material as THREE.Material | THREE.Material[];
                  (Array.isArray(mat) ? mat : [mat]).forEach((m) => {
                    (m as THREE.MeshStandardMaterial).side = THREE.DoubleSide;
                  });
                }
              });
              piece.scene.scale.set(16, 16, 16);
              piece.scene.position.set(-spec.lc[0] * 16, 0, -spec.lc[1] * 16);
              const group = new THREE.Group();
              group.add(piece.scene);
              group.rotation.order = 'YXZ';
              group.rotation.y = spec.yaw;
              if (spec.lean) group.rotation.x = spec.lean;
              const fy = spec.y ?? FURN_Y;
              group.position.set(spec.cx, fy, spec.cz);
              scene.add(group);
              if (spec.box) {
                const swap = Math.abs(Math.sin(spec.yaw)) > 0.5;
                const hw = (swap ? spec.d : spec.w) / 2;
                const hd = (swap ? spec.w : spec.d) / 2;
                boxes.push({
                  minX: spec.cx - hw, maxX: spec.cx + hw,
                  minZ: spec.cz - hd, maxZ: spec.cz + hd,
                  minY: fy, maxY: fy + spec.h,
                });
              }
            } catch {
              // one missing piece never blocks the walkthrough
            }
          }),
        );
        if (disposed) return;
        input.ground = meshGround(input.pos.x, input.pos.z, input.ground);
        setReady(true);
        last = performance.now();
        raf = requestAnimationFrame(tick);
      })
      .catch((err) => {
        if (!disposed) setLoadError(err instanceof Error ? err.message : String(err));
      });

    return () => {
      disposed = true;
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

      {!ready && !loadError && (
        <div
          style={{
            position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
            padding: '0.6rem 1.1rem', background: 'rgba(10,10,12,0.8)',
            fontSize: '1rem', letterSpacing: '0.08em', pointerEvents: 'none',
          }}
        >
          Loading the model…
        </div>
      )}
      {loadError && (
        <div
          style={{
            position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
            padding: '0.6rem 1.1rem', background: 'rgba(60,10,10,0.85)',
            fontSize: '1rem', pointerEvents: 'none', maxWidth: '80%',
          }}
        >
          The model failed to load: {loadError}
        </div>
      )}

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
          🔒 Locked
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
