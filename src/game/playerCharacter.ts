import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// The homeowner (Goodguy.glb, verified by the Models chat
// 2026-11-12: 1.76 m, bind clean, nine clips). This module owns
// loading him and translating controller state into animation.
// Placement and facing stay with the caller — the group stands
// at the controller's feet, rotated to its yaw.
//
// Animations are LAYERED (Adam's ask, 2026-11-13: "merge those
// 2 animations when needed" — walking to a door played the
// Open Door clip over his whole body and his legs stopped).
// Every clip is split at load into a LEGS sub-clip (hips + leg
// bones) and an UPPER sub-clip (spine, arms, head). Locomotion
// owns the legs always; the upper slot plays locomotion's upper
// half until a one-shot (door, lock…) takes it over, then hands
// it back when the one-shot finishes.

const LOCO_CLIPS = ['Idle', 'Walk', 'Run'] as const;
type LocoClip = (typeof LOCO_CLIPS)[number];

const LEG_BONES = new Set([
  'Hips',
  'LeftUpLeg', 'LeftLeg', 'LeftFoot', 'LeftToeBase', 'LeftToe_End',
  'RightUpLeg', 'RightLeg', 'RightFoot', 'RightToeBase', 'RightToe_End',
]);

function splitClip(clip: THREE.AnimationClip): { legs: THREE.AnimationClip; upper: THREE.AnimationClip } {
  const legs: THREE.KeyframeTrack[] = [];
  const upper: THREE.KeyframeTrack[] = [];
  for (const track of clip.tracks) {
    const bone = track.name.split('.')[0];
    (LEG_BONES.has(bone) ? legs : upper).push(track);
  }
  return {
    legs: new THREE.AnimationClip(`${clip.name}#legs`, clip.duration, legs),
    upper: new THREE.AnimationClip(`${clip.name}#upper`, clip.duration, upper),
  };
}

// One blend slot: a set of same-layer actions with crossfades
// between them (the legs slot, or the upper-body slot).
class ClipSlot {
  private actions = new Map<string, THREE.AnimationAction>();
  private current: THREE.AnimationAction | null = null;
  currentName = '';

  constructor(
    private mixer: THREE.AnimationMixer,
    clips: THREE.AnimationClip[],
    loop: boolean,
  ) {
    for (const clip of clips) {
      const action = mixer.clipAction(clip);
      if (loop) {
        action.setLoop(THREE.LoopRepeat, Infinity);
      } else {
        action.setLoop(THREE.LoopOnce, 1);
        action.clampWhenFinished = true;
      }
      this.actions.set(clip.name.split('#')[0], action);
    }
  }

  has(name: string): boolean {
    return this.actions.has(name);
  }

  action(name: string): THREE.AnimationAction | undefined {
    return this.actions.get(name);
  }

  fadeTo(name: string, dur = 0.18): void {
    const next = this.actions.get(name);
    if (!next || next === this.current) return;
    if (this.current) this.current.fadeOut(dur);
    next.reset().fadeIn(dur).play();
    this.current = next;
    this.currentName = name;
  }

  // Fade the current action out and forget it, so the next
  // fadeTo re-asserts from scratch (used when a one-shot takes
  // the upper body over from locomotion).
  suspend(dur = 0.12): void {
    if (this.current) this.current.fadeOut(dur);
    this.current = null;
    this.currentName = '';
  }
}

export class PlayerCharacter {
  readonly group = new THREE.Group();
  private mixer: THREE.AnimationMixer | null = null;
  private legs: ClipSlot | null = null;
  private upperLoco: ClipSlot | null = null;
  private upperOnce: ClipSlot | null = null;
  private oneShotActive = false;
  private locoName: LocoClip = 'Idle';

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

    const legsLoco: THREE.AnimationClip[] = [];
    const upperLocoClips: THREE.AnimationClip[] = [];
    const upperOnceClips: THREE.AnimationClip[] = [];
    for (const clip of gltf.animations) {
      const { legs, upper } = splitClip(clip);
      if ((LOCO_CLIPS as readonly string[]).includes(clip.name)) {
        legsLoco.push(legs);
        upperLocoClips.push(upper);
      } else {
        upperOnceClips.push(upper);
      }
    }
    this.legs = new ClipSlot(this.mixer, legsLoco, true);
    this.upperLoco = new ClipSlot(this.mixer, upperLocoClips, true);
    this.upperOnce = new ClipSlot(this.mixer, upperOnceClips, false);
    this.mixer.addEventListener('finished', (e) => {
      // A one-shot finished: hand the upper body back to
      // locomotion at whatever it is currently doing.
      if (this.oneShotActive && this.upperOnce?.action(this.upperOnce.currentName) === e.action) {
        this.oneShotActive = false;
        // The finished action is clamped at its last pose and
        // would keep diluting the returning locomotion unless
        // it is explicitly faded out.
        e.action.fadeOut(0.15);
        this.upperLoco?.fadeTo(this.locoName, 0.15);
      }
    });
    this.legs.fadeTo('Idle', 0);
    this.upperLoco.fadeTo('Idle', 0);
  }

  // Play a one-shot clip (door opening, lock toggle, pickup…)
  // on the upper body only — the legs keep walking. Ignored
  // while another one-shot is still running.
  playOnce(name: string): void {
    if (this.oneShotActive || !this.upperOnce?.has(name)) return;
    this.oneShotActive = true;
    // Locomotion's upper half steps aside for the one-shot's span.
    this.upperLoco?.suspend(0.12);
    this.upperOnce.fadeTo(name, 0.12);
  }

  // speed = the controller's actual ground speed (m/s) this frame.
  update(dt: number, speed: number): void {
    if (!this.mixer || !this.legs || !this.upperLoco) return;
    const want: LocoClip = speed < 0.15 ? 'Idle' : speed < 3.6 ? 'Walk' : 'Run';
    this.locoName = want;
    if (want !== this.legs.currentName) this.legs.fadeTo(want);
    if (!this.oneShotActive && want !== this.upperLoco.currentName) {
      this.upperLoco.fadeTo(want);
    }
    this.mixer.update(dt);
  }
}
