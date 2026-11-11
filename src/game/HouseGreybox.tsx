import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { DOORS, FLOOR_Y, ROOMS, SHAFT_DOWN, SHAFT_UP, shaftHeightAt, type FloorId, type ShaftDef } from './house';

// Greybox v1: floors drawn exploded apart (extra vertical gap) so the
// whole stack reads at once. Orbit to inspect; walk mode comes later.
// Rooms are slabs + low perimeter walls; labels are canvas sprites.

const FLOOR_COLORS: Record<FloorId, number> = {
  basement: 0x4a4a55,
  main: 0x8a7a5f,
  upstairs: 0x6f8296,
  garage: 0x707070,
};

// Extra separation between floors in the exploded view.
const EXPLODE = 2.2;

function makeLabel(text: string, sub?: string): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = 'rgba(10,10,12,0.72)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#e8e4da';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (sub) {
    ctx.font = 'bold 38px Georgia, serif';
    ctx.fillText(text, canvas.width / 2, 42);
    ctx.fillStyle = '#ffc46b';
    ctx.font = '30px Georgia, serif';
    ctx.fillText(sub, canvas.width / 2, 90);
  } else {
    ctx.font = 'bold 44px Georgia, serif';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
  }
  const texture = new THREE.CanvasTexture(canvas);
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: texture, transparent: true }),
  );
  sprite.scale.set(3.4, 0.85, 1);
  return sprite;
}

const fmtM = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

export default function HouseGreybox() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0c);

    const camera = new THREE.PerspectiveCamera(
      50,
      mount.clientWidth / mount.clientHeight,
      0.1,
      200,
    );
    camera.position.set(14, 13, 18);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(1.5, 0, 0);
    controls.enableDamping = true;

    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const sun = new THREE.DirectionalLight(0xfff2dd, 1.6);
    sun.position.set(10, 18, 8);
    scene.add(sun);
    // A cold fill from below so the basement slab still reads.
    const fill = new THREE.DirectionalLight(0x8899bb, 0.5);
    fill.position.set(-8, -10, -6);
    scene.add(fill);

    const wallMat = new THREE.MeshStandardMaterial({
      color: 0xd8d2c4,
      roughness: 0.9,
    });

    const explodeY = (floor: FloorId) =>
      FLOOR_Y[floor] +
      Math.sign(FLOOR_Y[floor]) * EXPLODE * (floor === 'main' || floor === 'garage' ? 0 : 1);

    for (const room of ROOMS) {
      const w = room.x[1] - room.x[0];
      const d = room.z[1] - room.z[0];
      const cx = (room.x[0] + room.x[1]) / 2;
      const cz = (room.z[0] + room.z[1]) / 2;
      const y = explodeY(room.floor);

      if (room.id.includes('closet')) {
        const cl = makeLabel(room.name, `${fmtM(w)} \u00d7 ${fmtM(d)} m`);
        cl.position.set(cx, y + 1.7, cz);
        scene.add(cl);
        continue;
      }

      const slab = new THREE.Mesh(
        new THREE.BoxGeometry(w, 0.15, d),
        new THREE.MeshStandardMaterial({
          color: FLOOR_COLORS[room.floor],
          roughness: 0.85,
        }),
      );
      slab.position.set(cx, y, cz);
      scene.add(slab);

      // Low perimeter walls (1m) — greybox massing, door gaps come later.
      const wallH = 1;
      const mkWall = (ww: number, dd: number, px: number, pz: number) => {
        const wall = new THREE.Mesh(new THREE.BoxGeometry(ww, wallH, dd), wallMat);
        wall.position.set(px, y + wallH / 2, pz);
        scene.add(wall);
      };
      mkWall(w, 0.1, cx, room.z[0]);
      mkWall(w, 0.1, cx, room.z[1]);
      mkWall(0.1, d, room.x[0], cz);
      mkWall(0.1, d, room.x[1], cz);

      const label = makeLabel(room.name, `${fmtM(w)} × ${fmtM(d)} m`);
      label.position.set(cx, y + 1.7, cz);
      scene.add(label);
    }

    // ---- Scale: a 1m grid under the whole stack (20m across, centred
    // on the house + garage), so wall lengths can be counted off, and
    // a FRONT marker on the street side (+z).
    const grid = new THREE.GridHelper(20, 20, 0x556677, 0x2b3038);
    grid.position.set(2.75, explodeY('basement') - 0.4, 0);
    const gridMat = grid.material as THREE.Material;
    gridMat.transparent = true;
    gridMat.opacity = 0.55;
    scene.add(grid);
    const front = makeLabel('FRONT — street');
    front.scale.set(2.6, 0.65, 1);
    front.position.set(0.75, explodeY('main') + 0.4, 6.4);
    scene.add(front);

    // ---- Doorway indicators: an amber panel standing in each opening,
    // so the doors read at a glance against the plain walls. (The
    // stair-mouth markers are skipped — the stairs get their own
    // indicator below.)
    const roomById = new Map(ROOMS.map((r) => [r.id, r]));
    const doorMat = new THREE.MeshStandardMaterial({
      color: 0xffb020,
      emissive: 0xcc7a00,
      emissiveIntensity: 0.45,
      roughness: 0.6,
    });
    for (const door of DOORS) {
      if (door.marker) continue;
      const room = roomById.get(door.between[0]) ?? roomById.get(door.between[1]);
      if (!room) continue;
      const y = explodeY(room.floor);
      const onXEdge =
        Math.abs(door.at.x - room.x[0]) < 0.01 || Math.abs(door.at.x - room.x[1]) < 0.01;
      const panel = new THREE.Mesh(
        onXEdge
          ? new THREE.BoxGeometry(0.22, 1.15, 1.0)
          : new THREE.BoxGeometry(1.0, 1.15, 0.22),
        doorMat,
      );
      panel.position.set(door.at.x, y + 0.08 + 0.575, door.at.z);
      scene.add(panel);
    }

    // ---- Stair indicators: orange switchback steps for both shafts.
    // Each shaft stands on its own base floor in the exploded stack
    // and rises toward the floor it serves (the explode gap means it
    // stops short \u2014 that's the diagram doing its job).
    const stairMat = new THREE.MeshStandardMaterial({
      color: 0xff7722,
      emissive: 0x992f00,
      emissiveIntensity: 0.35,
      roughness: 0.7,
    });
    const drawShaft = (shaft: ShaftDef, baseFloor: FloorId, labelText: string) => {
      const baseY = explodeY(baseFloor) + 0.08;
      const midZ = (shaft.z[0] + shaft.z[1]) / 2;
      const N = 8;
      const runLen = shaft.runX[1] - shaft.runX[0];
      for (const runZC of [shaft.z[0] + 0.5, shaft.z[1] - 0.5]) {
        for (let i = 0; i < N; i++) {
          const xA = shaft.runX[0] + (i * runLen) / N;
          const xB = shaft.runX[0] + ((i + 1) * runLen) / N;
          const surf = Math.max(
            shaftHeightAt(shaft, xA, runZC) ?? shaft.base,
            shaftHeightAt(shaft, xB, runZC) ?? shaft.base,
          );
          const top = baseY + (surf - shaft.base);
          const h = top - baseY + 0.05;
          if (h <= 0.02) continue;
          const step = new THREE.Mesh(
            new THREE.BoxGeometry(xB - xA + 0.02, h, 0.96),
            stairMat,
          );
          step.position.set((xA + xB) / 2, top - h / 2 + 0.025, runZC);
          scene.add(step);
        }
      }
      // The half-landing block, against the east wall.
      const land = new THREE.Mesh(
        new THREE.BoxGeometry(shaft.landingX[1] - shaft.landingX[0], 1.55, shaft.z[1] - shaft.z[0]),
        stairMat,
      );
      land.position.set((shaft.landingX[0] + shaft.landingX[1]) / 2, baseY + 1.55 / 2, midZ);
      scene.add(land);
      const label = makeLabel(labelText, 'switchback \u00b7 box 5 \u00d7 2 m');
      label.position.set((shaft.x[0] + shaft.x[1]) / 2, baseY + 4.0, midZ);
      scene.add(label);
    };
    drawShaft(SHAFT_UP, 'main', 'STAIRS UP');
    drawShaft(SHAFT_DOWN, 'basement', 'STAIRS DOWN');

    let raf = 0;
    const tick = () => {
      controls.update();
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    tick();

    const onResize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      controls.dispose();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.Sprite) {
          obj.geometry?.dispose?.();
          const mat = obj.material as THREE.Material | THREE.Material[];
          (Array.isArray(mat) ? mat : [mat]).forEach((m) => {
            const withMap = m as THREE.MeshStandardMaterial;
            withMap.map?.dispose?.();
            m.dispose();
          });
        }
      });
    };
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
      <div
        style={{
          position: 'absolute',
          left: 12,
          bottom: 12,
          padding: '0.35rem 0.7rem',
          background: 'rgba(10,10,12,0.72)',
          fontSize: '0.85rem',
          pointerEvents: 'none',
        }}
      >
        {ROOMS.length} rooms · {DOORS.length} doors · 4 levels
        <br />
        <span style={{ color: '#ffb020' }}>Amber panel</span> = doorway ·{' '}
        <span style={{ color: '#ff7722' }}>Orange steps</span> = stairs
        <br />
        Grid squares = 1 m · House footprint 12 × 9 m · Floors 3 m apart
      </div>
    </div>
  );
}
