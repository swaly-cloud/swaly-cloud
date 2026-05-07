// Generate PWA PNG icons using Canvas API via node-canvas
// Simple script that creates placeholder icons if canvas is not available

const fs = require('fs');
const path = require('path');

const iconsDir = path.join(__dirname, '../public/icons');
if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true });

// Create SVG-based PNG using raw SVG embedded in HTML-like structure
// We'll create a minimal PNG using pure Node.js Buffer manipulation

function createMinimalPNG(size, color = '#0A0A0A') {
  // PNG signature
  const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  function crc32(buf) {
    let crc = 0xffffffff;
    const table = [];
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c;
    }
    for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
    return (crc ^ 0xffffffff) >>> 0;
  }

  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const typeAndData = Buffer.concat([Buffer.from(type), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(typeAndData));
    return Buffer.concat([len, typeAndData, crc]);
  }

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type RGB
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  // Parse hex color
  const r = parseInt(color.slice(1,3), 16);
  const g = parseInt(color.slice(3,5), 16);
  const b = parseInt(color.slice(5,7), 16);

  // Gold color for center circle
  const gr = 0xD4, gg = 0xAF, gb = 0x37;

  // Create pixel data
  const zlib = require('zlib');
  const rowSize = size * 3;
  const rawData = Buffer.alloc(size * (rowSize + 1));

  const cx = size / 2, cy = size / 2;
  const outerR = size * 0.45;
  const innerR = size * 0.30;
  const crownR = size * 0.18;

  for (let y = 0; y < size; y++) {
    rawData[y * (rowSize + 1)] = 0; // filter type
    for (let x = 0; x < size; x++) {
      const dx = x - cx, dy = y - cy;
      const dist = Math.sqrt(dx*dx + dy*dy);
      const offset = y * (rowSize + 1) + 1 + x * 3;

      // Outer gold ring (glasses outline)
      const leftDx = x - cx * 0.6, rightDx = x - cx * 1.4;
      const leftDist = Math.sqrt(leftDx*leftDx + dy*dy);
      const rightDist = Math.sqrt(rightDx*rightDx + dy*dy);
      const lensR = size * 0.22;
      const lensRing = size * 0.05;

      if (
        (leftDist < lensR && leftDist > lensR - lensRing) ||
        (rightDist < lensR && rightDist > lensR - lensRing)
      ) {
        rawData[offset] = gr; rawData[offset+1] = gg; rawData[offset+2] = gb;
      } else if (Math.abs(x - cx) < size * 0.05 && Math.abs(y - cy) < size * 0.025) {
        // Bridge
        rawData[offset] = gr; rawData[offset+1] = gg; rawData[offset+2] = gb;
      } else if (dist < crownR && y < cy) {
        // Crown area - gold
        rawData[offset] = gr; rawData[offset+1] = gg; rawData[offset+2] = gb;
      } else {
        // Background
        rawData[offset] = r; rawData[offset+1] = g; rawData[offset+2] = b;
      }
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const png = Buffer.concat([
    PNG_SIGNATURE,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0)),
  ]);
  return png;
}

const sizes = [192, 512];
sizes.forEach(size => {
  const png = createMinimalPNG(size);
  const outPath = path.join(iconsDir, `icon-${size}.png`);
  fs.writeFileSync(outPath, png);
  console.log(`Generated: icon-${size}.png (${png.length} bytes)`);
});

// Also create apple-touch-icon
const apple = createMinimalPNG(180);
fs.writeFileSync(path.join(iconsDir, 'apple-touch-icon.png'), apple);
console.log('Generated: apple-touch-icon.png');
