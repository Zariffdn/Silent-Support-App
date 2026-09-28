// One-off: generate assets/light.png — the app's single light source.
//
// A 512x512 white RGBA image whose alpha falls off smoothly from the centre to
// fully transparent at the edge. In the app it is tinted (Image.tintColor) and
// animated with the native driver (opacity / scale) to become every "pool" of
// light: under a feeling, behind the response, and the breath in Comfort Mode.
// Pure Node (zlib only) so it needs no image dependency. Run: node scripts/make-light.js
const fs = require('fs');
const zlib = require('zlib');

const SIZE = 512;
const R = SIZE / 2;
// Falloff exponent: higher = tighter core. 1.8 gives a soft lamp-like spill.
const FALLOFF = 1.8;

function crc32(buf) {
  let c;
  const table = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td), 0);
  return Buffer.concat([len, td, crc]);
}

// Raw scanlines: filter byte 0 + RGBA per pixel.
const raw = Buffer.alloc(SIZE * (1 + SIZE * 4));
// Deterministic ordered dither (4x4 Bayer) so the falloff has no banding but
// the output is reproducible.
const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];
for (let y = 0; y < SIZE; y++) {
  const row = y * (1 + SIZE * 4);
  raw[row] = 0;
  for (let x = 0; x < SIZE; x++) {
    const dx = x + 0.5 - R;
    const dy = y + 0.5 - R;
    const r = Math.min(1, Math.sqrt(dx * dx + dy * dy) / R);
    const a = Math.pow(1 - r, FALLOFF) * 255;
    const dither = (BAYER[y & 3][x & 3] + 0.5) / 16 - 0.5; // -0.47..+0.47
    const alpha = Math.max(0, Math.min(255, Math.round(a + dither)));
    const i = row + 1 + x * 4;
    raw[i] = 255;
    raw[i + 1] = 255;
    raw[i + 2] = 255;
    raw[i + 3] = alpha;
  }
}

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(SIZE, 0);
ihdr.writeUInt32BE(SIZE, 4);
ihdr[8] = 8; // bit depth
ihdr[9] = 6; // RGBA
ihdr[10] = 0;
ihdr[11] = 0;
ihdr[12] = 0;

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', ihdr),
  chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
  chunk('IEND', Buffer.alloc(0)),
]);

fs.writeFileSync('assets/light.png', png);
console.log(`assets/light.png written (${png.length} bytes)`);
