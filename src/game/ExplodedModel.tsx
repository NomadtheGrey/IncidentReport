import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Exploded view of Adam's Blockbench model (public/models/all-floors.gltf):
// the same loaded house as ModelWalk, drawn three times — once per floor
// band — with each band clipped to its own y-range and lifted apart
// vertically. Drag to orbit, scroll to zoom. No furniture: this is a view
// of the house model itself.

// Floor bands in game-space y (model anchors: basement -2.5..0, main
// 0..2.5, top 2.5..5), cut just above each floor's base plane.
const BANDS: { name: string; lo: number; hi: number; offset: number }[] = [
  { name: 'BASEMENT', lo: -2.6, hi: 0.02, offset: -3.4 },
  { name: 'MAIN FLOOR', lo: 0.02, hi: 2.52, offset: 0 },
  { name: 'UPSTAIRS', lo: 2.52, hi: 5.1, offset: 3.4 },
];

export default function ExplodedModel() {
  const mountRef = useRef<HTMLDivElement>(null);
  const labelRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    let disposed = false;
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.localClippingEnabled = true;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x14161c);
    const camera = new THREE.PerspectiveCamera(
      50,
      mount.clientWidth / mount.clientHeight,
      0.1,
      300,
    );

    scene.add(new THREE.HemisphereLight(0xfff6e0, 0x3a4152, 1.15));
    const sun = new THREE.DirectionalLight(0xffffff, 1.6);
    sun.position.set(14, 22, 10);
    scene.add(sun);
    const fill = new THREE.DirectionalLight(0xbfd4ff, 0.45);
    fill.position.set(-12, 8, -14);
    scene.add(fill);

    // A quiet ground plane under the exploded stack.
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(60, 60),
      new THREE.MeshStandardMaterial({ color: 0x1e2129, roughness: 1 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(0, -6.05, 0.5);
    scene.add(ground);

    // Orbit state: spherical around the house centre.
    const target = new THREE.Vector3(0, 1.1, 0.5);
    let theta = Math.PI * 0.78;
    let phi = 1.02;
    let radius = 19;
    const applyCamera = () => {
      camera.position.set(
        target.x + radius * Math.sin(phi) * Math.sin(theta),
        target.y + radius * Math.cos(phi),
        target.z + radius * Math.sin(phi) * Math.cos(theta),
      );
      camera.lookAt(target);
    };
    applyCamera();

    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    const onDown = (e: PointerEvent) => {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      renderer.domElement.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      theta -= (e.clientX - lastX) * 0.008;
      phi = THREE.MathUtils.clamp(phi - (e.clientY - lastY) * 0.008, 0.25, 1.45);
      lastX = e.clientX;
      lastY = e.clientY;
      applyCamera();
    };
    const onUp = () => {
      dragging = false;
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      radius = THREE.MathUtils.clamp(radius + e.deltaY * 0.02, 9, 34);
      applyCamera();
    };
    const el = renderer.domElement;
    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('wheel', onWheel, { passive: false });
    el.style.touchAction = 'none';
    el.style.cursor = 'grab';

    const loader = new GLTFLoader();
    loader.load('models/all-floors.gltf', (gltf) => {
      if (disposed) return;
      for (const band of BANDS) {
        const holder = new THREE.Group();
        // Same placement as ModelWalk's holder.
        holder.scale.set(-16, 16, 16);
        holder.rotation.y = Math.PI / 2;
        holder.position.set(0, band.offset, 0.5);
        const copy = gltf.scene.clone(true);
        const lo = band.lo + band.offset;
        const hi = band.hi + band.offset;
        const planes = [
          new THREE.Plane(new THREE.Vector3(0, 1, 0), -lo),
          new THREE.Plane(new THREE.Vector3(0, -1, 0), hi),
        ];
        copy.traverse((o) => {
          const mesh = o as THREE.Mesh;
          if (mesh.isMesh) {
            const src = mesh.material as THREE.Material;
            const mat = src.clone() as THREE.MeshStandardMaterial;
            mat.side = THREE.DoubleSide;
            mat.clippingPlanes = planes;
            mesh.material = mat;
          }
        });
        holder.add(copy);
        scene.add(holder);
      }
    });

    // Label anchors: east edge of each band, mid-height.
    const anchors = BANDS.map(
      (b) => new THREE.Vector3(6.3, (b.lo + b.hi) / 2 + b.offset, 0.5),
    );
    const v = new THREE.Vector3();
    let raf = 0;
    const tick = () => {
      if (disposed) return;
      renderer.render(scene, camera);
      anchors.forEach((a, i) => {
        const lab = labelRefs.current[i];
        if (!lab) return;
        v.copy(a).project(camera);
        const behind = v.z > 1;
        lab.style.display = behind ? 'none' : 'block';
        lab.style.left = `${((v.x + 1) / 2) * mount.clientWidth}px`;
        lab.style.top = `${((1 - v.y) / 2) * mount.clientHeight}px`;
      });
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
      disposed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('wheel', onWheel);
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div ref={mountRef} style={{ position: 'relative', width: '100%', height: '100%' }}>
      {BANDS.map((b, i) => (
        <div
          key={b.name}
          ref={(n) => {
            labelRefs.current[i] = n;
          }}
          style={{
            position: 'absolute',
            transform: 'translate(8px, -50%)',
            background: 'rgba(10,10,14,0.72)',
            color: '#fff',
            fontSize: '0.72rem',
            letterSpacing: '0.12em',
            padding: '0.2rem 0.5rem',
            borderRadius: 3,
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          {b.name}
        </div>
      ))}
    </div>
  );
}
