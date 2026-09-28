import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { SOUND_SOURCES } from './sounds';
import type { ComfortAudio } from '../../lib/preferences';

// Gapless ambient loop, owned by Comfort Mode (and previewed from Settings).
//
// expo-audio's built-in `loop` leaves a tiny silence when it seeks back to the
// start. To avoid that, we run TWO players of the same clip and hand off with a
// short crossfade: just before the playing copy ends, the other copy starts and
// we ramp volume across them. One copy is always already sounding, so there is
// no gap. Everything is best-effort and never throws — on any failure Comfort
// Mode simply continues in silence.
//
// Every start/stop is serialised through a generation counter: a call that is
// superseded while it awaits (a second tap, a screen blur) cleans up whatever it
// created and steps aside, so there is never an orphaned loop.

const OVERLAP_MS = 800; // how early the next copy starts before the current ends
const TICK_MS = 80;
// Start the next copy a little past the very beginning, so the overlapping
// region is *different* ambience (not the same start/end content doubling up,
// which caused a loudness bump).
const LOOP_SKIP_S = 0.3;

// Entry / exit ramps. Every visual element in Comfort Mode fades; the sound
// arrives and leaves the same way rather than as a hard cut.
const FADE_IN_MS = 900;
const FADE_OUT_MS = 300;
const RAMP_STEP_MS = 40;

let players: AudioPlayer[] = [];
let timer: ReturnType<typeof setInterval> | null = null;
let active = 0;
let target = 0.4;
let fading = false;
let fadeMs = 0;
let gen = 0;
let rampTimer: ReturnType<typeof setInterval> | null = null;

const clamp = (v: number) => Math.min(1, Math.max(0, v));

function cancelRamp() {
  if (rampTimer) {
    clearInterval(rampTimer);
    rampTimer = null;
  }
}

/** One volume ramp at a time; starting another cancels the one in flight. */
function ramp(player: AudioPlayer, from: number, to: number, ms: number): Promise<void> {
  cancelRamp();
  return new Promise((resolve) => {
    const steps = Math.max(1, Math.round(ms / RAMP_STEP_MS));
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      const t = Math.min(1, i / steps);
      try {
        player.volume = clamp(from + (to - from) * t);
      } catch {
        // player may already be gone
      }
      if (t >= 1) {
        clearInterval(id);
        if (rampTimer === id) rampTimer = null;
        resolve();
      }
    }, RAMP_STEP_MS);
    rampTimer = id;
  });
}

function tick() {
  const cur = players[active];
  const next = players[(active + 1) % 2];
  if (!cur || !next) return;

  if (!fading) {
    let dur = 0;
    let pos = 0;
    try {
      dur = cur.duration || 0;
      pos = cur.currentTime || 0;
    } catch {
      return;
    }
    if (dur > 0 && dur - pos <= OVERLAP_MS / 1000) {
      fading = true;
      fadeMs = 0;
      try {
        next.seekTo(LOOP_SKIP_S);
        next.volume = 0;
        next.play();
      } catch {
        // ignore; will retry next tick conditions
      }
    }
    return;
  }

  // Crossfade in progress: equal-power ramp (constant perceived loudness).
  fadeMs += TICK_MS;
  const t = clamp(fadeMs / OVERLAP_MS);
  const g = (Math.PI / 2) * t;
  try {
    cur.volume = target * Math.cos(g);
    next.volume = target * Math.sin(g);
  } catch {
    // ignore
  }
  if (t >= 1) {
    try {
      cur.pause();
      cur.seekTo(LOOP_SKIP_S);
      cur.volume = 0;
    } catch {
      // ignore
    }
    active = (active + 1) % 2;
    fading = false;
  }
}

function release(ps: AudioPlayer[]) {
  for (const p of ps) {
    try {
      p.pause();
      p.remove();
    } catch {
      // resource may already be gone
    }
  }
}

/** Fade out whatever is sounding and release it. Does not touch the generation. */
async function stopCurrent(): Promise<void> {
  cancelRamp();
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  const ps = players;
  const sounding = players[active];
  const other = players[(active + 1) % 2];
  players = [];
  active = 0;
  const wasFading = fading;
  fading = false;
  fadeMs = 0;
  if (sounding) {
    let from = 0;
    try {
      from = sounding.volume;
    } catch {
      // ignore
    }
    // Mid-crossfade both copies sound; silence the incoming one at once and
    // ramp the louder one down.
    if (wasFading && other) {
      try {
        other.volume = 0;
      } catch {
        // ignore
      }
    }
    await ramp(sounding, from, 0, FADE_OUT_MS);
  }
  release(ps);
}

export async function startAmbient(sound: ComfortAudio, volume: number): Promise<void> {
  const my = ++gen;
  await stopCurrent();
  if (gen !== my) return;
  const source = SOUND_SOURCES[sound];
  if (!source) return; // silent / haptics / missing asset

  try {
    await setAudioModeAsync({ playsInSilentMode: false, shouldPlayInBackground: false });
    if (gen !== my) return;
    target = clamp(volume);
    const a = createAudioPlayer(source);
    const b = createAudioPlayer(source);
    if (gen !== my) {
      release([a, b]);
      return;
    }
    a.loop = false;
    b.loop = false;
    a.volume = 0;
    b.volume = 0;
    players = [a, b];
    active = 0;
    fading = false;
    fadeMs = 0;
    a.play();
    timer = setInterval(tick, TICK_MS);
    void ramp(a, 0, target, FADE_IN_MS);
  } catch {
    await stopAmbient(); // silent fallback
  }
}

export async function stopAmbient(): Promise<void> {
  ++gen;
  await stopCurrent();
}

/** Adjust the level of whatever is sounding, in place, with no restart. */
export function setAmbientVolume(volume: number): void {
  target = clamp(volume);
  if (fading) return; // the crossfade tick will pick up the new target
  const cur = players[active];
  if (!cur) return;
  cancelRamp();
  try {
    cur.volume = target;
  } catch {
    // ignore
  }
}
