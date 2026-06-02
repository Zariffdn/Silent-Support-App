import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { SOUND_SOURCES } from './sounds';
import type { ComfortAudio } from '../../lib/preferences';

// Gapless ambient loop, owned by Comfort Mode.
//
// expo-audio's built-in `loop` leaves a tiny silence when it seeks back to the
// start. To avoid that, we run TWO players of the same clip and hand off with a
// short crossfade: just before the playing copy ends, the other copy starts and
// we ramp volume across them. One copy is always already sounding, so there is
// no gap. Everything is best-effort and never throws — on any failure Comfort
// Mode simply continues in silence.

const OVERLAP_MS = 800; // how early the next copy starts before the current ends
const TICK_MS = 80;

let players: AudioPlayer[] = [];
let timer: ReturnType<typeof setInterval> | null = null;
let active = 0;
let target = 0.4;
let fading = false;
let fadeMs = 0;

const clamp = (v: number) => Math.min(1, Math.max(0, v));

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
        next.seekTo(0);
        next.volume = 0;
        next.play();
      } catch {
        // ignore; will retry next tick conditions
      }
    }
    return;
  }

  // Crossfade in progress: ramp current down, next up.
  fadeMs += TICK_MS;
  const t = clamp(fadeMs / OVERLAP_MS);
  try {
    cur.volume = target * (1 - t);
    next.volume = target * t;
  } catch {
    // ignore
  }
  if (t >= 1) {
    try {
      cur.pause();
      cur.seekTo(0);
      cur.volume = 0;
    } catch {
      // ignore
    }
    active = (active + 1) % 2;
    fading = false;
  }
}

export async function startAmbient(sound: ComfortAudio, volume: number): Promise<void> {
  await stopAmbient();
  const source = SOUND_SOURCES[sound];
  if (!source) return; // silent / haptics / missing asset

  try {
    await setAudioModeAsync({ playsInSilentMode: false, shouldPlayInBackground: false });
    target = clamp(volume);
    const a = createAudioPlayer(source);
    const b = createAudioPlayer(source);
    a.loop = false;
    b.loop = false;
    a.volume = target;
    b.volume = 0;
    players = [a, b];
    active = 0;
    fading = false;
    fadeMs = 0;
    a.play();
    timer = setInterval(tick, TICK_MS);
  } catch {
    await stopAmbient(); // silent fallback
  }
}

export async function stopAmbient(): Promise<void> {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  const ps = players;
  players = [];
  active = 0;
  fading = false;
  fadeMs = 0;
  for (const p of ps) {
    try {
      p.pause();
      p.remove();
    } catch {
      // resource may already be gone
    }
  }
}
