// One-off: turn the large stereo WAVs into small, mono, seamless-looping clips.
// - strips leading/trailing silence (the source of the MP3 loop "gap")
// - downmixes to mono and caps length (keeps the app bundle small)
// - applies a short self-crossfade so end -> start is gapless
// Pure PCM math; no external tools required.
const fs = require('fs');
const path = require('path');

const DIR = path.join('assets', 'audio');
const FILES = ['ocean', 'rain', 'forest', 'brown'];
const MAX_SEC = 40;
const FADE_SEC = 0.15;
const SILENCE = 300; // 16-bit amplitude threshold

function parseWav(buf) {
  if (buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WAVE') {
    throw new Error('not a RIFF/WAVE file');
  }
  let off = 12;
  let fmt = null;
  let dataOff = -1;
  let dataLen = 0;
  while (off + 8 <= buf.length) {
    const id = buf.toString('ascii', off, off + 4);
    const size = buf.readUInt32LE(off + 4);
    const body = off + 8;
    if (id === 'fmt ') {
      fmt = {
        audioFormat: buf.readUInt16LE(body),
        channels: buf.readUInt16LE(body + 2),
        sampleRate: buf.readUInt32LE(body + 4),
        bitsPerSample: buf.readUInt16LE(body + 14),
      };
    } else if (id === 'data') {
      dataOff = body;
      dataLen = Math.min(size, buf.length - body);
    }
    off = body + size + (size % 2);
  }
  if (!fmt || dataOff < 0) throw new Error('missing fmt/data chunk');
  return { fmt, dataOff, dataLen };
}

function process(name) {
  const p = path.join(DIR, name + '.wav');
  const buf = fs.readFileSync(p);
  const { fmt, dataOff, dataLen } = parseWav(buf);
  if (fmt.audioFormat !== 1 || fmt.bitsPerSample !== 16) {
    console.log(`${name}: SKIP (format=${fmt.audioFormat}, ${fmt.bitsPerSample}-bit not handled)`);
    return;
  }
  const ch = fmt.channels;
  const sr = fmt.sampleRate;
  const frame = ch * 2;
  const frames = Math.floor(dataLen / frame);

  const mono = new Int16Array(frames);
  for (let i = 0; i < frames; i++) {
    let sum = 0;
    const base = dataOff + i * frame;
    for (let c = 0; c < ch; c++) sum += buf.readInt16LE(base + c * 2);
    mono[i] = Math.round(sum / ch);
  }

  let start = 0;
  let end = frames - 1;
  while (start < frames && Math.abs(mono[start]) < SILENCE) start++;
  while (end > start && Math.abs(mono[end]) < SILENCE) end--;
  if (start >= end) {
    start = 0;
    end = frames - 1;
  }

  const maxFrames = MAX_SEC * sr;
  const region = mono.subarray(start, Math.min(end + 1, start + maxFrames));
  const M = region.length;

  const F = Math.min(Math.floor(FADE_SEC * sr), Math.floor(M / 4));
  let out;
  if (F > 0 && M > 2 * F) {
    out = new Int16Array(M - F);
    for (let i = 0; i < out.length; i++) {
      if (i < F) {
        const w = i / F;
        out[i] = Math.round(region[i] * w + region[M - F + i] * (1 - w));
      } else {
        out[i] = region[i];
      }
    }
  } else {
    out = Int16Array.from(region);
  }

  const dataBytes = out.length * 2;
  const wav = Buffer.alloc(44 + dataBytes);
  wav.write('RIFF', 0);
  wav.writeUInt32LE(36 + dataBytes, 4);
  wav.write('WAVE', 8);
  wav.write('fmt ', 12);
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(sr, 24);
  wav.writeUInt32LE(sr * 2, 28);
  wav.writeUInt16LE(2, 32);
  wav.writeUInt16LE(16, 34);
  wav.write('data', 36);
  wav.writeUInt32LE(dataBytes, 40);
  for (let i = 0; i < out.length; i++) wav.writeInt16LE(out[i], 44 + i * 2);
  fs.writeFileSync(p, wav);

  console.log(
    `${name}: ${(buf.length / 1e6).toFixed(1)}MB -> ${(wav.length / 1e6).toFixed(1)}MB ` +
      `(${(out.length / sr).toFixed(1)}s mono @ ${sr}Hz, seamless)`,
  );
}

for (const f of FILES) {
  try {
    process(f);
  } catch (e) {
    console.log(`${f}: ERROR ${e.message}`);
  }
}
