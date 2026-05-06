import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const W = 1284, H = 2778;
const ORANGE = '#D24A25';
const CREAM = '#FBFAF9';
const ORANGE_END_Y = Math.round(H * 0.42);

const FONT = 'Noto Sans JP';

const OUT_DIR = 'attached_assets/appstore_resized';
fs.mkdirSync(OUT_DIR, { recursive: true });

const items = [
  {
    src: 'attached_assets/Simulator_Screenshot_-_iPhone_16_Pro_Max_-_2026-05-07_at_05.00_1778098193402.png',
    out: path.join(OUT_DIR, '01_home.png'),
    title: 'お店のおすそわけを発見',
    subtitle: '近所のお得なバッグをひと目でチェック',
  },
  {
    src: 'attached_assets/Simulator_Screenshot_-_iPhone_16_Pro_Max_-_2026-05-07_at_05.08_1778098193404.png',
    out: path.join(OUT_DIR, '03_detail.png'),
    title: '気になる一品をその場で確認',
    subtitle: '在庫・受取時間がひと目でわかる',
  },
  {
    src: 'attached_assets/Simulator_Screenshot_-_iPhone_16_Pro_Max_-_2026-05-07_at_05.08_1778098217885.png',
    out: path.join(OUT_DIR, '05_qr.png'),
    title: 'お店ではコードを見せるだけ',
    subtitle: '6桁の電子チケットでスムーズに受取',
  },
];

function escapeXml(s) {
  return s.replace(/[<>&'"]/g, c => ({ '<':'&lt;','>':'&gt;','&':'&amp;',"'":'&apos;','"':'&quot;' }[c]));
}

async function build({ src, out, title, subtitle }) {
  const charCount = [...title].length;
  const maxWidth = 1180;
  const titleFontSize = Math.min(112, Math.floor(maxWidth / charCount));
  const phoneScale = 0.82;
  const phoneW = Math.round(W * phoneScale);
  const phoneH = Math.round(H * phoneScale);
  const phoneX = Math.round((W - phoneW) / 2);
  const phoneY = Math.round(H * 0.20);
  const radius = 64;

  // Background SVG (orange top, cream bottom with subtle diagonal)
  const bgSvg = Buffer.from(`
    <svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="og" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#D24A25"/>
          <stop offset="100%" stop-color="#DF5D39"/>
        </linearGradient>
      </defs>
      <rect width="${W}" height="${H}" fill="${CREAM}"/>
      <path d="M0,0 L${W},0 L${W},${ORANGE_END_Y - 60} L0,${ORANGE_END_Y + 60} Z" fill="url(#og)"/>
      <text x="${W/2}" y="380" text-anchor="middle"
            font-family="${FONT}" font-weight="900" font-size="${titleFontSize}" fill="#ffffff"
            style="letter-spacing:-2px">${escapeXml(title)}</text>
      <text x="${W/2}" y="${380 + Math.round(titleFontSize * 0.95)}" text-anchor="middle"
            font-family="${FONT}" font-weight="500" font-size="52" fill="#ffffff" opacity="0.95">${escapeXml(subtitle)}</text>
    </svg>
  `);

  // Rounded mask for phone screenshot
  const maskSvg = Buffer.from(`
    <svg width="${phoneW}" height="${phoneH}" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="${phoneW}" height="${phoneH}" rx="${radius}" ry="${radius}" fill="#fff"/>
    </svg>
  `);

  const phone = await sharp(src)
    .resize(phoneW, phoneH, { fit: 'cover' })
    .composite([{ input: maskSvg, blend: 'dest-in' }])
    .png()
    .toBuffer();

  // Soft shadow under phone
  const shadowSvg = Buffer.from(`
    <svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="blur"><feGaussianBlur stdDeviation="22"/></filter>
      </defs>
      <rect x="${phoneX + 14}" y="${phoneY + 26}" width="${phoneW}" height="${phoneH}"
            rx="${radius}" ry="${radius}" fill="#000" opacity="0.22" filter="url(#blur)"/>
    </svg>
  `);

  await sharp(bgSvg)
    .composite([
      { input: shadowSvg, top: 0, left: 0 },
      { input: phone, top: phoneY, left: phoneX },
    ])
    .png()
    .toFile(out);

  console.log('wrote', out);
}

for (const it of items) await build(it);
