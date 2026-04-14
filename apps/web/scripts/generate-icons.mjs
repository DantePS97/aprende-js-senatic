/**
 * Genera los íconos PNG necesarios para la PWA usando únicamente
 * módulos nativos de Node.js (sin dependencias externas).
 *
 * Color: #6366F1 (Indigo 500 — color primario de la plataforma)
 * Salida: apps/web/public/icons/icon-192.png
 *         apps/web/public/icons/icon-512.png
 */

import { deflateSync } from 'zlib';
import { writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '../public/icons');

// ─── CRC32 (requerido por la especificación PNG) ──────────────────────────────

const CRC_TABLE = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  CRC_TABLE[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (const byte of buf) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

// ─── Helpers de chunks PNG ────────────────────────────────────────────────────

function pngChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

// ─── Generador de PNG sólido ──────────────────────────────────────────────────

function makeSolidPNG(size, r, g, b) {
  // Firma PNG
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); // width
  ihdr.writeUInt32BE(size, 4); // height
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type: RGB
  // compression=0, filter=0, interlace=0 (already zero)

  // Datos de imagen: una fila por scanline, prefijada por byte de filtro (0 = None)
  const rowSize = 1 + size * 3; // filter_byte + R+G+B por pixel
  const raw = Buffer.alloc(size * rowSize);
  for (let y = 0; y < size; y++) {
    const rowStart = y * rowSize;
    raw[rowStart] = 0; // filtro: None
    for (let x = 0; x < size; x++) {
      raw[rowStart + 1 + x * 3] = r;
      raw[rowStart + 2 + x * 3] = g;
      raw[rowStart + 3 + x * 3] = b;
    }
  }

  return Buffer.concat([
    signature,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', deflateSync(raw, { level: 6 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

mkdirSync(OUT_DIR, { recursive: true });

// Color primario: #6366F1 (Indigo 500)
const R = 0x63, G = 0x66, B = 0xf1;

writeFileSync(join(OUT_DIR, 'icon-192.png'), makeSolidPNG(192, R, G, B));
writeFileSync(join(OUT_DIR, 'icon-512.png'), makeSolidPNG(512, R, G, B));

console.log('✅  Íconos PWA generados en public/icons/');
