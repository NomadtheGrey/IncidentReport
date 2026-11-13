import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// The homeowner (Goodguy.glb, verified by the Models chat
// 2026-11-12: 1.76 m, bind clean, nine clips). This module owns
// loading him and translating controller state into animation:
// locomotion crossfades by ground speed, and one-shot actions
// (door, use, pickup…) play over the top, then hand control
// back. Placement and facing stay with the caller — the group
// stands at the controller's feet, rotated to its yaw.

const LOCO_CLIPS = ['Idle', 'Walk', 'Run'] as const;
type LocoClip = (typeof LOCO_CLIPS)[number];

export class PlayerCharacter {
  readonly group = new THREE.Group();
  private mixer: THREE.AnimationMixer | null = null;
  private actions = new Map<string, THREE.AnimationAction>();
  private current: THREE.AnimationAction | null = null;
  private currentName = '';
  private oneShotActive = false;

  // The GLB rides the repo as base64 text in chunked parts
  // (the push route is text-only and body-capped), so loading
  // = fetch the parts, join, decode, parse.
  async load(urls: string[]): Promise<void> {
    const parts = await Promise.all(
      urls.map(async (u) => {
        const res = await fetch(u);
        if (!res.ok) throw new Error(`character fetch ${res.status}`);
        return res.text();
      }),
    );
    const b64 = parts.join('').replace(/\s/g, '');
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const gltf = await new GLTFLoader().parseAsync(bytes.buffer, '');
    this.group.add(gltf.scene);
    this.mixer = new THREE.AnimationMixer(gltf.scene);
    for (const clip of gltf.animations) {
      const action = this.mixer.clipAction(clip);
      if ((LOCO_CLIPS as readonly string[]).includes(clip.name)) {
        action.setLoop(THREE.LoopRepeat, Infinity);
      } else {
        action.setLoop(THREE.LoopOnce, 1);
        action.clampWhenFinished = true;
      }
      this.actions.set(clip.name, action);
    }
    this.mixer.addEventListener('finished', () => {
      this.oneShotActive = false;
      // Force the locomotion state to re-assert next update.
      this.currentName = '';
    });
    const idle = this.actions.get('Idle');
    if (idle) {
      idle.play();
      this.current = idle;
      this.currentName = 'Idle';
    }
  }

  private fadeTo(name: string, dur = 0.18): void {
    const next = this.actions.get(name);
    if (!next || next === this.current) return;
    if (this.current) this.current.fadeOut(dur);
    next.reset().fadeIn(dur).play();
    this.current = next;
    this.currentName = name;
  }

  // Play a one-shot clip (door opening, lock toggle, pickup…).
  // Ignored while another one-shot is still running.
  playOnce(name: string): void {
    if (this.oneShotActive || !this.actions.has(name)) return;
    this.oneShotActive = true;
    this.fadeTo(name, 0.12);
  }

  // speed = the controller's actual ground speed (m/s) this frame.
  update(dt: number, speed: number): void {
    if (!this.mixer) return;
    if (!this.oneShotActive) {
      const want: LocoClip = speed < 0.15 ? 'Idle' : speed < 3.6 ? 'Walk' : 'Run';
      if (want !== this.currentName) this.fadeTo(want);
    }
    this.mixer.update(dt);
  }
}
