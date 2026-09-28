// One-off: build the splash image = the mark alone, centred on the dark canvas.
// The wordmark is gone on purpose: the app's typeface is Literata (not
// available to an SVG rasteriser here), and inside the app the brand is the
// mark's light, not the mark. Run with sharp available
// (npm install --no-save --legacy-peer-deps sharp). Pure asset generation;
// sharp is not a project dependency.
const sharp = require('sharp');

const W = 1254;
const H = 1568;
const BG = '#0E0F1A';
const MARK = 560;

async function main() {
  const mark = await sharp('assets/android_icon.png')
    .resize(MARK, MARK, { fit: 'contain', background: BG })
    .toBuffer();

  await sharp({ create: { width: W, height: H, channels: 3, background: BG } })
    .composite([
      // 'lighten' = max(canvas, logo). The logo's own near-black background
      // (#030418) is darker than the canvas on every channel, so it dissolves
      // into BG while the bright mark + glow are kept. No visible square.
      { input: mark, top: Math.round((H - MARK) / 2), left: Math.round((W - MARK) / 2), blend: 'lighten' },
    ])
    .png()
    .toFile('assets/splash.png');

  console.log('assets/splash.png written');
}

main().catch((e) => {
  console.error('FAIL', e.message);
  process.exit(1);
});
