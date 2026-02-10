// Generate a simple app icon as PNG using canvas
// Run: node scripts/generate-icon.js

import { writeFileSync } from 'fs';

// Create a simple 256x256 icon as a minimal BMP/PNG
// Since we don't have canvas, we'll create a minimal ICO file
// with a simple "MD" text-based design

// Minimal 256x256 32-bit RGBA bitmap
const size = 256;
const pixels = new Uint8Array(size * size * 4);

// Background: #0969da (blue)
const bgR = 9, bgG = 105, bgB = 218;
// Text: white
const fgR = 255, fgG = 255, fgB = 255;

// Fill background
for (let i = 0; i < size * size; i++) {
  // Add rounded corners
  const x = i % size;
  const y = Math.floor(i / size);
  const cornerRadius = 40;

  let inside = true;
  // Check corners
  if (x < cornerRadius && y < cornerRadius) {
    inside = Math.sqrt((cornerRadius - x) ** 2 + (cornerRadius - y) ** 2) <= cornerRadius;
  } else if (x >= size - cornerRadius && y < cornerRadius) {
    inside = Math.sqrt((x - (size - cornerRadius)) ** 2 + (cornerRadius - y) ** 2) <= cornerRadius;
  } else if (x < cornerRadius && y >= size - cornerRadius) {
    inside = Math.sqrt((cornerRadius - x) ** 2 + (y - (size - cornerRadius)) ** 2) <= cornerRadius;
  } else if (x >= size - cornerRadius && y >= size - cornerRadius) {
    inside = Math.sqrt((x - (size - cornerRadius)) ** 2 + (y - (size - cornerRadius)) ** 2) <= cornerRadius;
  }

  const idx = i * 4;
  if (inside) {
    pixels[idx] = bgR;
    pixels[idx + 1] = bgG;
    pixels[idx + 2] = bgB;
    pixels[idx + 3] = 255;
  } else {
    pixels[idx + 3] = 0; // transparent
  }
}

// Draw "M" letter (simple block font, centered)
function drawRect(x1, y1, w, h) {
  for (let y = y1; y < y1 + h && y < size; y++) {
    for (let x = x1; x < x1 + w && x < size; x++) {
      if (x >= 0 && y >= 0) {
        const idx = (y * size + x) * 4;
        pixels[idx] = fgR;
        pixels[idx + 1] = fgG;
        pixels[idx + 2] = fgB;
        pixels[idx + 3] = 255;
      }
    }
  }
}

// Letter "M" - positioned to look good as an icon
const letterX = 55;
const letterY = 65;
const strokeW = 24;
const letterH = 126;

// Left vertical
drawRect(letterX, letterY, strokeW, letterH);
// Left diagonal down
for (let i = 0; i < 40; i++) {
  drawRect(letterX + strokeW + i, letterY + i * 1.5, strokeW / 2, 4);
}
// Right diagonal down
for (let i = 0; i < 40; i++) {
  drawRect(letterX + strokeW + 40 + 12 - i, letterY + i * 1.5, strokeW / 2, 4);
}
// Right vertical
drawRect(letterX + strokeW + 52 + strokeW / 2, letterY, strokeW, letterH);

// Down arrow (markdown symbol ↓) - a simple "d" indicator
const arrowX = 165;
const arrowY = 80;
drawRect(arrowX, arrowY, strokeW, letterH - 15);
drawRect(arrowX - 20, arrowY + 50, strokeW + 40, strokeW);
// Slight arc at top right
drawRect(arrowX, arrowY + 25, strokeW + 20, strokeW);

// Write as raw PNG
// Create minimal PNG file
function createPNG(width, height, rgbaPixels) {
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  function crc32(buf) {
    let crc = -1;
    for (let i = 0; i < buf.length; i++) {
      crc ^= buf[i];
      for (let j = 0; j < 8; j++) {
        crc = (crc >>> 1) ^ ((crc & 1) ? 0xEDB88320 : 0);
      }
    }
    return (crc ^ -1) >>> 0;
  }

  function chunk(type, data) {
    const typeB = Buffer.from(type);
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const combined = Buffer.concat([typeB, data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(combined));
    return Buffer.concat([len, combined, crc]);
  }

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  // IDAT - raw pixel data with filter byte per row
  const rawData = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    rawData[y * (1 + width * 4)] = 0; // filter: none
    for (let x = 0; x < width; x++) {
      const srcIdx = (y * width + x) * 4;
      const dstIdx = y * (1 + width * 4) + 1 + x * 4;
      rawData[dstIdx] = rgbaPixels[srcIdx];
      rawData[dstIdx + 1] = rgbaPixels[srcIdx + 1];
      rawData[dstIdx + 2] = rgbaPixels[srcIdx + 2];
      rawData[dstIdx + 3] = rgbaPixels[srcIdx + 3];
    }
  }

  // Use zlib to compress
  const { deflateSync } = await import('zlib');
  const compressed = deflateSync(rawData);

  // IEND
  const iend = chunk('IEND', Buffer.alloc(0));

  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    iend
  ]);
}

// Since we're using top-level await, wrap in async
const { deflateSync } = await import('node:zlib');

function createPNGSync(width, height, rgbaPixels) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  function crc32(buf) {
    let crc = -1;
    for (let i = 0; i < buf.length; i++) {
      crc ^= buf[i];
      for (let j = 0; j < 8; j++) {
        crc = (crc >>> 1) ^ ((crc & 1) ? 0xEDB88320 : 0);
      }
    }
    return (crc ^ -1) >>> 0;
  }

  function chunk(type, data) {
    const typeB = Buffer.from(type);
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const combined = Buffer.concat([typeB, data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(combined));
    return Buffer.concat([len, combined, crc]);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;

  const rawData = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    rawData[y * (1 + width * 4)] = 0;
    for (let x = 0; x < width; x++) {
      const srcIdx = (y * width + x) * 4;
      const dstIdx = y * (1 + width * 4) + 1 + x * 4;
      rawData[dstIdx] = rgbaPixels[srcIdx];
      rawData[dstIdx + 1] = rgbaPixels[srcIdx + 1];
      rawData[dstIdx + 2] = rgbaPixels[srcIdx + 2];
      rawData[dstIdx + 3] = rgbaPixels[srcIdx + 3];
    }
  }

  const compressed = deflateSync(rawData);

  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

const png = createPNGSync(size, size, pixels);
writeFileSync('resources/icon.png', png);
console.log('Icon generated: resources/icon.png');
