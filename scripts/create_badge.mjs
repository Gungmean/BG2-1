import fs from 'fs';
import zlib from 'zlib';

function createCRC32Table() {
  let c;
  const table = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c;
  }
  return table;
}

const crcTable = createCRC32Table();
function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ -1) >>> 0;
}

function makeChunk(type, data) {
  const len = data.length;
  const buf = Buffer.alloc(8 + len + 4);
  buf.writeUInt32BE(len, 0);
  buf.write(type, 4, 4, 'ascii');
  data.copy(buf, 8);
  const crcTarget = buf.subarray(4, 8 + len);
  const crcVal = crc32(crcTarget);
  buf.writeUInt32BE(crcVal, 8 + len);
  return buf;
}

function generateBellPng(size, outputPath) {
  const width = size;
  const height = size;

  // Raw image buffer with filter bytes
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);

  const cx = width / 2;
  const cy = height / 2;
  const r = width * 0.38;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter: None

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;

      // Coordinate normalized -1 to 1
      const nx = (x - cx) / r;
      const ny = (y - cy) / r;

      let isInside = false;

      // 1. Top ring
      const ringDist = Math.hypot(nx, ny - (-0.75));
      if (ringDist <= 0.18) {
        isInside = true;
      }

      // 2. Bell Body
      if (ny >= -0.55 && ny <= 0.55) {
        // Bell shape profile: curves outward towards bottom
        const t = (ny - (-0.55)) / 1.1; // 0 at top, 1 at bottom
        const halfWidth = 0.3 + 0.5 * Math.pow(t, 2.2);
        if (Math.abs(nx) <= halfWidth) {
          isInside = true;
        }
      }

      // 3. Bell Bottom rim (horizontal ellipse)
      if (ny >= 0.45 && ny <= 0.65) {
        const rimDx = nx / 0.85;
        const rimDy = (ny - 0.55) / 0.12;
        if (rimDx * rimDx + rimDy * rimDy <= 1.0) {
          isInside = true;
        }
      }

      // 4. Clapper (bottom small dome)
      if (ny >= 0.60 && ny <= 0.85) {
        const clapDx = nx / 0.22;
        const clapDy = (ny - 0.70) / 0.15;
        if (clapDx * clapDx + clapDy * clapDy <= 1.0) {
          isInside = true;
        }
      }

      if (isInside) {
        // Solid White with full opacity (Android Status Bar mask)
        rawData[pxOffset] = 255;     // R
        rawData[pxOffset + 1] = 255; // G
        rawData[pxOffset + 2] = 255; // B
        rawData[pxOffset + 3] = 255; // Alpha
      } else {
        // Fully transparent
        rawData[pxOffset] = 0;
        rawData[pxOffset + 1] = 0;
        rawData[pxOffset + 2] = 0;
        rawData[pxOffset + 3] = 0;
      }
    }
  }

  // 1. Signature
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // 2. IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8-bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const ihdrChunk = makeChunk('IHDR', ihdr);

  // 3. IDAT (zlib compressed)
  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressedData);

  // 4. IEND
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  const finalPng = Buffer.concat([sig, ihdrChunk, idatChunk, iendChunk]);
  fs.writeFileSync(outputPath, finalPng);
  console.log(`Generated Android Badge: ${outputPath} (${width}x${height})`);
}

generateBellPng(72, 'public/badge-72.png');
generateBellPng(96, 'public/badge-96.png');
