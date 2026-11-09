import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { DOORS, FLOOR_Y, ROOMS, type FloorId } from './house';

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

function makeLabel(text: string): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = 'rgba(10,10,12,0.72)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#e8e4da';
  ctx.font = 'bold 44px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);
  const texture = new THREE.CanvasTexture(canvas);
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: texture, transparent: true }),
  );
  sprite.scale.set(3.4, 0.85, 1);
  return sprite;
}

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

    for (const room of ROOMS) {
      const w = room.x[1] - room.x[0];
      const d = room.z[1] - room.z[0];
      const cx = (room.x[0] + room.x[1]) / 2;
      const cz = (room.z[0] + room.z[1]) / 2;
      const y = FLOOR_Y[room.floor] + Math.sign(FLOOR_Y[room.floor]) * EXPLODE * (room.floor === 'main' || room.floor === 'garage' ? 0 : 1);

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

      const label = makeLabel(room.name);
      label.position.set(cx, y + 1.7, cz);
      scene.add(label);
    }

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
      </div>
    </div>
  );
}
