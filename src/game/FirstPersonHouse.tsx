import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  DOORS,
  FLOOR_Y,
  ROOMS,
  STAIR_DOWN,
  STAIR_UP,
  groundHeightAt,
  roomAt,
  type FloorId,
} from './house';

// First-person walkable house v1.
// - The solid house: floors stacked at real heights, walls built from the
//   room rectangles in house.ts with door gaps cut where DOORS say, and
//   the two stair flights as solid steps in the hall column.
// - Desktop: click to pointer-lock, mouse look, WASD / arrows, Shift run.
// - Phone: left-thumb virtual joystick (dynamic origin, push past ~85%
//   to run), drag anywhere else to look. No buttons needed yet — doors
//   are open gaps in v1 and there is nothing to pick up. Yet.
// - Collision is a circle vs wall boxes, per axis; ground height comes
//   from house.ts groundHeightAt (stairs are ramps in that function).

interface Collider {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  minY: number;
  maxY: number;
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

function buildHouse(scene: THREE.Scene): Collider[] {
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

  // ---- Floor slabs (top surface at the floor's y), with stair holes ----
  const slabFor = (room: (typeof ROOMS)[number]) => {
    const y = FLOOR_Y[room.floor];
    const mat = new THREE.MeshStandardMaterial({ color: FLOOR_TINT[room.floor], roughness: 0.9 });
    const hole =
      room.floor === 'upstairs' ? STAIR_UP : room.floor === 'main' ? STAIR_DOWN : null;
    const [x0, x1] = room.x;
    const [z0, z1] = room.z;
    const intersects =
      hole && hole.x[0] < x1 && hole.x[1] > x0 && hole.z[0] < z1 && hole.z[1] > z0;
    const pieces: Array<{ x: [number, number]; z: [number, number] }> = [];
    if (!intersects || !hole) {
      pieces.push({ x: [x0, x1], z: [z0, z1] });
    } else {
      if (hole.x[0] > x0) pieces.push({ x: [x0, hole.x[0]], z: [z0, z1] });
      if (hole.x[1] < x1) pieces.push({ x: [hole.x[1], x1], z: [z0, z1] });
      if (hole.z[0] > z0) pieces.push({ x: [hole.x[0], hole.x[1]], z: [z0, hole.z[0]] });
      if (hole.z[1] < z1) pieces.push({ x: [hole.x[0], hole.x[1]], z: [hole.z[1], z1] });
    }
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
        if (door.id === 'basement-door' || door.id === 'stairs-up') continue;
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

  // ---- Stairs: solid steps + stepped side enclosures ----
  const buildFlight = (
    flight: typeof STAIR_UP,
    yBottom: number,
    yTop: number,
    stepAt: (z: number) => number,
    guards: { west: Array<[number, number]>; east: Array<[number, number]> },
    railings: { west: Array<[number, number]>; east: Array<[number, number]> },
  ) => {
    const N = 15;
    const len = flight.z[1] - flight.z[0];
    const w = flight.x[1] - flight.x[0];
    const cx = (flight.x[0] + flight.x[1]) / 2;
    for (let i = 0; i < N; i++) {
      const zA = flight.z[0] + (i * len) / N;
      const zB = flight.z[0] + ((i + 1) * len) / N;
      const top = Math.max(stepAt(zA), stepAt(zB));
      const bottom = Math.min(yBottom, yTop) - 0.05;
      const h = top - bottom;
      if (h <= 0) continue;
      addBox(w, h, zB - zA + 0.03, cx, bottom + h / 2, (zA + zB) / 2, stepMat, false);
    }
    // Side enclosures sit ON the flight's edges (they eat flight width,
    // not slot width). Guard segments are explicit per side: a missing
    // segment is an entry — head-on at the flight's ends, plus a side
    // entry at the WEST of each flight's high end and low end, where
    // the step surface is within a short step of the floor beside it.
    const sides: Array<{ x: number; segs: Array<[number, number]> }> = [
      { x: flight.x[0], segs: guards.west },
      { x: flight.x[1], segs: guards.east },
    ];
    for (const { x, segs } of sides) {
      for (const [zA, zB] of segs) {
        const top = Math.min(Math.max(stepAt(zA), stepAt(zB)) + 0.95, Math.max(yBottom, yTop) + 0.95);
        const bottom = Math.min(yBottom, yTop);
        const h = top - bottom;
        if (h <= 0) continue;
        addBox(0.12, h, zB - zA, x, bottom + h / 2, (zA + zB) / 2, wallMat, true);
      }
    }
    // Upper-floor railings: the stepped guards top out below the upper
    // floor along most of the flight, so without these a walker on the
    // upper floor crosses straight over the open stairwell at floor
    // height. Railings guard the hole's edges at the upper floor,
    // with gaps only where an entry is intended.
    const upperY = Math.max(yBottom, yTop);
    const railSides: Array<{ x: number; segs: Array<[number, number]> }> = [
      { x: flight.x[0], segs: railings.west },
      { x: flight.x[1], segs: railings.east },
    ];
    for (const { x, segs } of railSides) {
      for (const [zA, zB] of segs) {
        addBox(0.12, 0.95, zB - zA, x, upperY + 0.475, (zA + zB) / 2, wallMat, true);
      }
    }
  };

  buildFlight(
    STAIR_UP,
    0,
    3,
    (z) => 3 * Math.min(1, Math.max(0, (STAIR_UP.z[1] - z) / (STAIR_UP.z[1] - STAIR_UP.z[0]))),
    {
      // West open at the top (z 0.5..1.3, side entry off the landing,
      // step surface 3.0..2.56) and at the bottom (z 2.9..3.9, entry
      // off the hall). East closed the whole way.
      west: [
        [1.3, 2.2],
        [2.2, 2.9],
      ],
      east: [
        [0.5, 1.7],
        [1.7, 2.9],
        [2.9, 3.9],
      ],
    },
    {
      // Landing-level railings: west open only at the top side entry
      // (z 0.5..1.3); east railed the whole length of the hole.
      west: [[1.3, 3.9]],
      east: [[0.5, 3.9]],
    },
  );
  buildFlight(
    STAIR_DOWN,
    0,
    -3,
    (z) => -3 * Math.min(1, Math.max(0, (STAIR_DOWN.z[1] - z) / (STAIR_DOWN.z[1] - STAIR_DOWN.z[0]))),
    {
      // West open at the top (z -1.5..-0.5, side entry off the hall,
      // step surface 0..-0.88). East closed the whole way.
      west: [
        [-3.9, -2.7],
        [-2.7, -1.5],
      ],
      east: [
        [-3.9, -2.77],
        [-2.77, -1.63],
        [-1.63, -0.5],
      ],
    },
    {
      // Main-level railings: west open only at the top side entry
      // (z -1.5..-0.5); east railed the whole length of the hole.
      west: [[-3.9, -1.5]],
      east: [[-3.9, -0.5]],
    },
  );

  // ---- The world outside: one big dark ground plane at street level ----
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(45, 40),
    new THREE.MeshStandardMaterial({ color: 0x1d241c, roughness: 1 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.09;
  scene.add(ground);

  return colliders;
}

export default function FirstPersonHouse() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [roomName, setRoomName] = useState('Primary Bedroom');
  const [isTouch, setIsTouch] = useState(false);
  const [stick, setStick] = useState<{ ox: number; oy: number; dx: number; dy: number } | null>(null);

  const inputRef = useRef({
    keys: new Set<string>(),
    yaw: -Math.PI / 2, // face east, toward the bedroom door
    pitch: 0,
    stickVec: { x: 0, y: 0, mag: 0 },
    pos: new THREE.Vector3(-3.4, 3, 2.5),
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
      [3.5, 2.4, -2],
      [0.7, 5.4, 2],
      [8.5, 2.4, -1],
      [0, -0.6, 0],
    ] as const) {
      const p = new THREE.PointLight(0xffd9a0, 12, 11, 1.8);
      p.position.set(x, y, z);
      scene.add(p);
    }

    const colliders = buildHouse(scene);

    const collides = (x: number, z: number, ground: number): boolean => {
      const bodyLo = ground + 0.05;
      const bodyHi = ground + 1.75;
      for (const c of colliders) {
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
        {isTouch ? 'Left thumb: move · drag: look' : 'Click: look · WASD: move · Shift: run'}
      </div>

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
