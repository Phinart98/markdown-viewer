const fs = require('fs');
const zlib = require('zlib');

const size = 256;
const pixels = new Uint8Array(size * size * 4);

// Background: #0969da (GitHub blue)
const bgR = 9, bgG = 105, bgB = 218;

// Fill with rounded rect background
for (let i = 0; i < size * size; i++) {
  const x = i % size;
  const y = Math.floor(i / size);
  const r = 40;

  let inside = true;
  if (x < r && y < r) inside = Math.hypot(r - x, r - y) <= r;
  else if (x >= size - r && y < r) inside = Math.hypot(x - (size - r), r - y) <= r;
  else if (x < r && y >= size - r) inside = Math.hypot(r - x, y - (size - r)) <= r;
  else if (x >= size - r && y >= size - r) inside = Math.hypot(x - (size - r), y - (size - r)) <= r;

  const idx = i * 4;
  if (inside) {
    pixels[idx] = bgR;
    pixels[idx + 1] = bgG;
    pixels[idx + 2] = bgB;
    pixels[idx + 3] = 255;
  }
}

// Draw white "Md" text
function fillRect(x1, y1, w, h) {
  for (let y = y1; y < Math.min(y1 + h, size); y++) {
    for (let x = x1; x < Math.min(x1 + w, size); x++) {
      if (x >= 0 && y >= 0) {
        const idx = (y * size + x) * 4;
        pixels[idx] = 255;
        pixels[idx + 1] = 255;
        pixels[idx + 2] = 255;
        pixels[idx + 3] = 255;
      }
    }
  }
}

// "M" letter
const s = 22; // stroke width
fillRect(38, 60, s, 136);           // left vertical
fillRect(38 + s, 60, s, s);        // top-left bridge
for (let i = 0; i < 50; i++) {     // left diagonal
  fillRect(38 + s + Math.floor(i * 0.6), 60 + i * 2, 12, 3);
}
for (let i = 0; i < 50; i++) {     // right diagonal
  fillRect(38 + s + 30 - Math.floor(i * 0.6), 60 + i * 2, 12, 3);
}
fillRect(38 + s + 30, 60, s, s);   // top-right bridge
fillRect(38 + s + 30 + s, 60, s, 136); // right vertical

// "d" letter (lowercase)
const dx = 155;
fillRect(dx + 40, 55, s, 141);     // right vertical (tall)
fillRect(dx, 120, 40 + s, s);      // top horizontal
fillRect(dx, 120, s, 76);          // left vertical
fillRect(dx, 174, 40 + s, s);      // bottom horizontal

// Create PNG
function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xEDB88320 : 0);
  }
  return (crc ^ -1) >>> 0;
}

function chunk(type, data) {
  const t = Buffer.from(type);
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const combined = Buffer.concat([t, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(combined));
  return Buffer.concat([len, combined, crc]);
}

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(size, 0);
ihdr.writeUInt32BE(size, 4);
ihdr[8] = 8; ihdr[9] = 6;

const raw = Buffer.alloc(size * (1 + size * 4));
for (let y = 0; y < size; y++) {
  raw[y * (1 + size * 4)] = 0;
  for (let x = 0; x < size; x++) {
    const s2 = (y * size + x) * 4;
    const d = y * (1 + size * 4) + 1 + x * 4;
    raw[d] = pixels[s2]; raw[d+1] = pixels[s2+1]; raw[d+2] = pixels[s2+2]; raw[d+3] = pixels[s2+3];
  }
}

const png = Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  chunk('IHDR', ihdr),
  chunk('IDAT', zlib.deflateSync(raw)),
  chunk('IEND', Buffer.alloc(0))
]);

fs.writeFileSync('resources/icon.png', png);
console.log('Generated resources/icon.png (' + png.length + ' bytes)');
