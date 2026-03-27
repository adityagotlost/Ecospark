import QRCode from 'qrcode';
import { resolve } from 'path';

const code = 'MEGA_SPARK_10K';
const output = resolve('public', 'mega_qr.png');

QRCode.toFile(output, code, {
  width: 600,
  margin: 1,
  color: {
    dark: '#050d0a',
    light: '#f0fff4'
  }
}).then(() => {
  console.log('✅ Real QR generated at ' + output);
});
