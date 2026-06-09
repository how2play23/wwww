const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

const bytesPerPixel = 4;
const pngOutputPath = path.join(__dirname, '..', 'assets', 'icon.png');
const icoOutputPath = path.join(__dirname, '..', 'assets', 'icon.ico');

function makeCrcTable() {
  const table = new Uint32Array(256);

  for (let n = 0; n < 256; n += 1) {
    let c = n;

    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }

    table[n] = c >>> 0;
  }

  return table;
}

const crcTable = makeCrcTable();

function crc32(buffer) {
  let crc = 0xffffffff;

  for (const byte of buffer) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data = Buffer.alloc(0)) {
  const typeBuffer = Buffer.from(type);
  const chunkBuffer = Buffer.alloc(12 + data.length);

  chunkBuffer.writeUInt32BE(data.length, 0);
  typeBuffer.copy(chunkBuffer, 4);
  data.copy(chunkBuffer, 8);
  chunkBuffer.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 8 + data.length);

  return chunkBuffer;
}

function clamp(value) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function mix(a, b, amount) {
  return a + (b - a) * amount;
}

function distanceToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSquared = dx * dx + dy * dy;
  const t = lengthSquared === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lengthSquared));
  const x = ax + t * dx;
  const y = ay + t * dy;

  return Math.hypot(px - x, py - y);
}

function lineAlpha(px, py, ax, ay, bx, by, width) {
  const distance = distanceToSegment(px, py, ax, ay, bx, by);
  const edge = 2;

  if (distance <= width - edge) {
    return 1;
  }

  if (distance >= width + edge) {
    return 0;
  }

  return 1 - (distance - (width - edge)) / (edge * 2);
}

function blendPixel(buffer, index, color, alpha) {
  const existingAlpha = buffer[index + 3] / 255;
  const sourceAlpha = color[3] * alpha;
  const outAlpha = sourceAlpha + existingAlpha * (1 - sourceAlpha);

  if (outAlpha <= 0) {
    return;
  }

  buffer[index] = clamp((color[0] * sourceAlpha + buffer[index] * existingAlpha * (1 - sourceAlpha)) / outAlpha);
  buffer[index + 1] = clamp((color[1] * sourceAlpha + buffer[index + 1] * existingAlpha * (1 - sourceAlpha)) / outAlpha);
  buffer[index + 2] = clamp((color[2] * sourceAlpha + buffer[index + 2] * existingAlpha * (1 - sourceAlpha)) / outAlpha);
  buffer[index + 3] = clamp(outAlpha * 255);
}

function createPng(size) {
  const raw = Buffer.alloc((size * bytesPerPixel + 1) * size);
  const scale = size / 512;

  for (let y = 0; y < size; y += 1) {
    const rowStart = y * (size * bytesPerPixel + 1);
    raw[rowStart] = 0;

    for (let x = 0; x < size; x += 1) {
      const index = rowStart + 1 + x * bytesPerPixel;
      const nx = x / (size - 1);
      const ny = y / (size - 1);
      const glow = Math.max(0, 1 - Math.hypot(nx - 0.28, ny - 0.22) * 1.55);
      const glowTwo = Math.max(0, 1 - Math.hypot(nx - 0.78, ny - 0.82) * 1.7);

      raw[index] = clamp(mix(8, 74, glow) + glowTwo * 20);
      raw[index + 1] = clamp(mix(13, 92, glow) + glowTwo * 60);
      raw[index + 2] = clamp(mix(30, 220, glow) + glowTwo * 70);
      raw[index + 3] = 255;
    }
  }

  for (let y = 0; y < size; y += 1) {
    const rowStart = y * (size * bytesPerPixel + 1);

    for (let x = 0; x < size; x += 1) {
      const index = rowStart + 1 + x * bytesPerPixel;
      const ringDistance = Math.abs(Math.hypot(x - 256 * scale, y - 256 * scale) - 176 * scale);
      const ringAlpha = Math.max(0, 1 - ringDistance / (5 * scale));
      const left = lineAlpha(x, y, 184 * scale, 372 * scale, 256 * scale, 128 * scale, 19 * scale);
      const right = lineAlpha(x, y, 328 * scale, 372 * scale, 256 * scale, 128 * scale, 19 * scale);
      const cross = lineAlpha(x, y, 218 * scale, 280 * scale, 294 * scale, 280 * scale, 16 * scale);
      const markAlpha = Math.max(left, right, cross);

      blendPixel(raw, index, [199, 210, 254, 0.5], ringAlpha * 0.34);
      blendPixel(raw, index, [248, 250, 252, 0.96], markAlpha);
    }
  }

  const header = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);

  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([header, chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND')]);
}

function createIco(pngBuffer) {
  const header = Buffer.alloc(6);
  const directory = Buffer.alloc(16);
  const imageOffset = header.length + directory.length;

  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);

  directory[0] = 0;
  directory[1] = 0;
  directory[2] = 0;
  directory[3] = 0;
  directory.writeUInt16LE(1, 4);
  directory.writeUInt16LE(32, 6);
  directory.writeUInt32LE(pngBuffer.length, 8);
  directory.writeUInt32LE(imageOffset, 12);

  return Buffer.concat([header, directory, pngBuffer]);
}

const pngBuffer = createPng(512);
const icoPngBuffer = createPng(256);

fs.mkdirSync(path.dirname(pngOutputPath), { recursive: true });
fs.writeFileSync(pngOutputPath, pngBuffer);
fs.writeFileSync(icoOutputPath, createIco(icoPngBuffer));

console.log(`Created ${pngOutputPath}`);
console.log(`Created ${icoOutputPath}`);
