// One-off: build the splash image = logo (android_icon) + "Silent Support"
// wordmark in serif, centered on the dark app canvas. Run with sharp available
// (npm install --no-save --legacy-peer-deps sharp). Pure asset generation; sharp
// is not a project dependency.
const sharp = require('sharp');

const W = 1254;
const H = 1568;
const BG = '#0E0F1A';
const MARK = 720;
const INK = '#E8E5DC';

async function main() {
  const mark = await sharp('assets/android_icon.png')
    .resize(MARK, MARK, { fit: 'contain', background: BG })
    .toBuffer();

  const wordmark = Buffer.from(
    `<svg width="${W}" height="240" xmlns="http://www.w3.org/2000/svg">
       <text x="50%" y="150" text-anchor="middle"
             font-family="Georgia, 'Times New Roman', serif"
             font-size="96" letter-spacing="1" fill="${INK}">Silent Support</text>
     </svg>`,
  );

  await sharp({ create: { width: W, height: H, channels: 3, background: BG } })
    .composite([
      { input: mark, top: 360, left: Math.round((W - MARK) / 2) },
      { input: wordmark, top: 1130, left: 0 },
    ])
    .png()
    .toFile('assets/splash.png');

  console.log('assets/splash.png written');
}

main().catch((e) => {
  console.error('FAIL', e.message);
  process.exit(1);
});
