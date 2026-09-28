// One-off: build two transparent mark assets from the padded, opaque source icon:
//   assets/android_adaptive_foreground.png — Android adaptive-icon FOREGROUND
//     (mark spans ~60% of the 1024 canvas, inside the launcher's safe zone)
//   assets/splash-mark.png — the mark alone, for the expo-splash-screen plugin
//     (rendered at a fixed dp width on both platforms, so the splash mark is the
//     same physical size everywhere)
// Luminance becomes alpha: the near-black ground drops out, the mark and its glow
// stay. Run with sharp available (npm install --no-save --legacy-peer-deps sharp).
const sharp = require('sharp');

const OUT = 1024;
const FILL = 0.6; // fraction of the adaptive canvas the mark's bounding box spans

async function transparentMark() {
  const { data, info } = await sharp('assets/android_icon.png')
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const out = Buffer.alloc(width * height * 4);
  let minX = width, minY = height, maxX = 0, maxY = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * channels;
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      const a = Math.max(0, Math.min(255, Math.round(((lum - 6) / (255 - 6)) * 255 * 1.15)));
      const j = (y * width + x) * 4;
      out[j] = a > 0 ? Math.min(255, Math.round((r * 255) / Math.max(a, 1))) : 0;
      out[j + 1] = a > 0 ? Math.min(255, Math.round((g * 255) / Math.max(a, 1))) : 0;
      out[j + 2] = a > 0 ? Math.min(255, Math.round((b * 255) / Math.max(a, 1))) : 0;
      out[j + 3] = a;
      if (a > 24) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  // Crop to the mark's bounding box plus a little room for the glow.
  const pad = Math.round(Math.max(maxX - minX, maxY - minY) * 0.08);
  const left = Math.max(0, minX - pad);
  const top = Math.max(0, minY - pad);
  const w = Math.min(width - left, maxX - minX + pad * 2);
  const h = Math.min(height - top, maxY - minY + pad * 2);
  return sharp(out, { raw: { width, height, channels: 4 } })
    .extract({ left, top, width: w, height: h })
    .png()
    .toBuffer();
}

async function main() {
  const mark = await transparentMark();
  const box = Math.round(OUT * FILL);
  const fitted = await sharp(mark)
    .resize(box, box, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  const blank = { create: { width: OUT, height: OUT, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } };
  await sharp(blank)
    .composite([{ input: fitted, top: Math.round((OUT - box) / 2), left: Math.round((OUT - box) / 2) }])
    .png()
    .toFile('assets/android_adaptive_foreground.png');
  console.log('assets/android_adaptive_foreground.png written');

  // The splash mark: the cropped mark on a square transparent canvas, no padding
  // beyond the glow, so imageWidth in app.json is the mark's real width.
  const side = Math.max((await sharp(mark).metadata()).width, (await sharp(mark).metadata()).height);
  await sharp(mark)
    .resize(side, side, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile('assets/splash-mark.png');
  console.log('assets/splash-mark.png written');
}

main().catch((e) => {
  console.error('FAIL', e.message);
  process.exit(1);
});
