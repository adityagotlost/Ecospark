import QRCode from 'qrcode';
import { writeFileSync } from 'fs';

const stations = [
  { code: 'ECO_FEST_2024', name: 'Eco Fest Station',   emoji: '🎪', color: '#ffd700', points: 100 },
  { code: 'GREEN_CAMPUS',  name: 'Green Campus Station', emoji: '🌿', color: '#34d364', points: 100 },
  { code: 'SOLAR_PUNK',    name: 'Solar Punk Station',  emoji: '☀️', color: '#f97316', points: 100 },
  { code: 'RECYCLE_PRO',   name: 'Recycle Pro Station', emoji: '♻️', color: '#00e5c4', points: 100 },
  { code: 'MEGA_SPARK_10K', name: 'Mega Spark Station', emoji: '💎', color: '#fbbf24', points: 10000 },
];

const qrDataURLs = {};
for (const s of stations) {
  qrDataURLs[s.code] = await QRCode.toDataURL(s.code, {
    width: 300,
    margin: 2,
    color: { dark: '#050d0a', light: '#f0fff4' },
  });
}

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>EcoSpark QR Posters</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@700;900&family=Inter:wght@400;600&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #eef9f2; font-family: 'Inter', sans-serif; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0; }
  .poster {
    width: 100%; aspect-ratio: 3/4;
    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1.5rem;
    padding: 2.5rem 2rem;
    background: #040c08;
    border: 4px solid var(--color);
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .poster-badge {
    background: var(--color);
    color: #040c08;
    font-family: 'Outfit', sans-serif;
    font-weight: 900;
    font-size: 0.75rem;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    padding: 0.3rem 1rem;
    border-radius: 100px;
  }
  .poster-title {
    font-family: 'Outfit', sans-serif;
    font-weight: 900;
    font-size: 2rem;
    color: #fff;
    text-align: center;
    line-height: 1.15;
  }
  .poster-title span { color: var(--color); }
  .qr-wrap {
    background: #f0fff4;
    border-radius: 1rem;
    padding: 1rem;
    border: 3px solid var(--color);
    box-shadow: 0 0 40px -5px var(--color);
  }
  .qr-wrap img { width: 220px; height: 220px; display: block; image-rendering: pixelated; }
  .code-label {
    font-family: 'Outfit', sans-serif;
    font-weight: 700;
    font-size: 1rem;
    color: var(--color);
    letter-spacing: 0.1em;
    background: rgba(255,255,255,0.06);
    border: 1px solid var(--color);
    border-radius: 8px;
    padding: 0.4rem 1rem;
    word-break: break-all;
    text-align: center;
  }
  .earn { color: #aaa; font-size: 0.85rem; text-align: center; }
  .earn strong { color: #fff; font-size: 1.3rem; font-weight: 700; }
  @media print {
    .grid { page-break-after: always; }
    .poster { page-break-inside: avoid; break-inside: avoid; }
    body { background: white; }
  }
</style>
</head>
<body>
<div class="grid">
${stations.map(s => `
<div class="poster" style="--color: ${s.color}">
  <div class="poster-badge">🌱 EcoSpark Eco-Station</div>
  <div class="poster-title">${s.emoji} <span>${s.name.replace(' Station','')}</span><br>Station</div>
  <div class="qr-wrap"><img src="${qrDataURLs[s.code]}" alt="${s.code}" /></div>
  <div class="code-label">${s.code}</div>
  <div class="earn">Scan to earn <strong>+${s.points.toLocaleString()} EcoPoints</strong></div>
</div>`).join('\n')}
</div>
</body>
</html>`;

writeFileSync('public/eco-station-posters.html', html);
console.log('✅ Saved to: public/eco-station-posters.html');
