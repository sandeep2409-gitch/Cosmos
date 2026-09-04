import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

const ICON_DIR = path.join(process.cwd(), 'assets', 'icons');
if (!fs.existsSync(ICON_DIR)) {
  fs.mkdirSync(ICON_DIR, { recursive: true });
}

// CRC32 table
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) c = 0xedb88320 ^ (c >>> 1);
    else c = c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const typeAndData = Buffer.concat([typeBuf, data]);
  const crcVal = crc32(typeAndData);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crcVal, 0);
  return Buffer.concat([lenBuf, typeAndData, crcBuf]);
}

function createPNG(width, height, drawFn) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8 bits per channel
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const ihdrChunk = makeChunk('IHDR', ihdr);

  const rawData = Buffer.alloc(height * (width * 4 + 1));

  // Blend color over existing pixel (alpha blending)
  const drawPixel = (x, y, r, g, b, a = 1.0) => {
    x = Math.floor(x);
    y = Math.floor(y);
    if (x < 0 || x >= width || y < 0 || y >= height) return;
    const idx = y * (width * 4 + 1) + 1 + x * 4;
    
    const existingA = rawData[idx + 3] / 255;
    const newA = Math.max(0, Math.min(1, a));
    const outA = newA + existingA * (1 - newA);
    
    if (outA > 0) {
      const outR = Math.round((r * newA + rawData[idx] * existingA * (1 - newA)) / outA);
      const outG = Math.round((g * newA + rawData[idx + 1] * existingA * (1 - newA)) / outA);
      const outB = Math.round((b * newA + rawData[idx + 2] * existingA * (1 - newA)) / outA);
      
      rawData[idx] = Math.min(255, Math.max(0, outR));
      rawData[idx + 1] = Math.min(255, Math.max(0, outG));
      rawData[idx + 2] = Math.min(255, Math.max(0, outB));
      rawData[idx + 3] = Math.min(255, Math.max(0, Math.round(outA * 255)));
    }
  };

  // Canvas drawing primitives
  const gfx = {
    clear: () => rawData.fill(0),
    pixel: drawPixel,
    fillCircle: (cx, cy, radius, [r, g, b, a = 1]) => {
      for (let y = Math.floor(cy - radius - 1); y <= Math.ceil(cy + radius + 1); y++) {
        for (let x = Math.floor(cx - radius - 1); x <= Math.ceil(cx + radius + 1); x++) {
          const dist = Math.hypot(x - cx, y - cy);
          if (dist <= radius) {
            const edgeAlpha = Math.min(1, radius - dist + 0.5);
            drawPixel(x, y, r, g, b, a * Math.max(0, edgeAlpha));
          }
        }
      }
    },
    fillRect: (rx, ry, rw, rh, [r, g, b, a = 1]) => {
      for (let y = Math.floor(ry); y < Math.ceil(ry + rh); y++) {
        for (let x = Math.floor(rx); x < Math.ceil(rx + rw); x++) {
          drawPixel(x, y, r, g, b, a);
        }
      }
    },
    fillRoundRect: (rx, ry, rw, rh, radius, [r, g, b, a = 1]) => {
      for (let y = Math.floor(ry); y < Math.ceil(ry + rh); y++) {
        for (let x = Math.floor(rx); x < Math.ceil(rx + rw); x++) {
          let inside = false;
          let dist = 0;
          const left = rx + radius;
          const right = rx + rw - radius;
          const top = ry + radius;
          const bottom = ry + rh - radius;
          
          if (x >= left && x <= right) inside = true;
          else if (y >= top && y <= bottom) inside = true;
          else {
            const cx = x < left ? left : right;
            const cy = y < top ? top : bottom;
            dist = Math.hypot(x - cx, y - cy);
            if (dist <= radius) inside = true;
          }
          
          if (inside) {
            const edgeAlpha = dist > 0 ? Math.min(1, radius - dist + 0.5) : 1;
            drawPixel(x, y, r, g, b, a * Math.max(0, edgeAlpha));
          }
        }
      }
    },
    drawLine: (x0, y0, x1, y1, width, [r, g, b, a = 1]) => {
      const len = Math.hypot(x1 - x0, y1 - y0);
      if (len === 0) return;
      const dx = (x1 - x0) / len;
      const dy = (y1 - y0) / len;
      for (let t = 0; t <= len; t += 0.5) {
        const cx = x0 + dx * t;
        const cy = y0 + dy * t;
        gfx.fillCircle(cx, cy, width / 2, [r, g, b, a]);
      }
    }
  };

  drawFn(gfx, width, height);

  const compressed = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, ihdrChunk, idatChunk, iendChunk]);
}

// Map of icon generators
const icons = {
  // 1. Rocket Icon
  rocket: (g, w, h) => {
    // Body (cyan/blue gradient look)
    g.fillRoundRect(24, 16, 16, 28, 6, [56, 189, 248]); // cyan
    // Tip
    g.fillCircle(32, 16, 8, [244, 63, 94]); // red/pink nose
    // Wings
    g.fillRoundRect(14, 32, 12, 14, 3, [244, 63, 94]);
    g.fillRoundRect(38, 32, 12, 14, 3, [244, 63, 94]);
    // Porthole
    g.fillCircle(32, 28, 5, [255, 255, 255]);
    g.fillCircle(32, 28, 3, [15, 23, 42]);
    // Flame
    g.fillCircle(32, 48, 6, [245, 158, 11]); // orange
    g.fillCircle(32, 52, 4, [252, 211, 77]); // yellow
  },

  // 2. Galaxy / Space Icon
  galaxy: (g, w, h) => {
    g.fillCircle(32, 32, 24, [147, 51, 234, 0.3]); // purple glow
    g.fillCircle(32, 32, 16, [56, 189, 248, 0.5]); // cyan glow
    g.fillCircle(32, 32, 8, [255, 255, 255]); // bright core
    // Spiral arms
    for (let a = 0; a < Math.PI * 4; a += 0.1) {
      const r = a * 3.5;
      const x1 = 32 + Math.cos(a) * r;
      const y1 = 32 + Math.sin(a) * r;
      const x2 = 32 + Math.cos(a + Math.PI) * r;
      const y2 = 32 + Math.sin(a + Math.PI) * r;
      g.fillCircle(x1, y1, 2.5, [192, 132, 252, 0.8]);
      g.fillCircle(x2, y2, 2.5, [56, 189, 248, 0.8]);
    }
  },

  // 3. Target / Bullseye Icon
  target: (g, w, h) => {
    g.fillCircle(32, 32, 24, [244, 63, 94, 0.3]);
    g.fillCircle(32, 32, 20, [244, 63, 94]);
    g.fillCircle(32, 32, 14, [15, 23, 42]);
    g.fillCircle(32, 32, 8, [244, 63, 94]);
    g.fillCircle(32, 32, 4, [255, 255, 255]);
    // Crosshairs
    g.drawLine(32, 4, 32, 12, 3, [255, 255, 255]);
    g.drawLine(32, 52, 32, 60, 3, [255, 255, 255]);
    g.drawLine(4, 32, 12, 32, 3, [255, 255, 255]);
    g.drawLine(52, 32, 60, 32, 3, [255, 255, 255]);
  },

  // 4. Help / Question Icon
  help: (g, w, h) => {
    g.fillCircle(32, 32, 26, [56, 189, 248]); // cyan circle background
    g.fillCircle(32, 32, 22, [15, 23, 42]); // dark center
    // Question mark
    g.fillCircle(32, 22, 9, [56, 189, 248]);
    g.fillCircle(32, 23, 5, [15, 23, 42]);
    g.fillRect(27, 22, 10, 10, [15, 23, 42]); // cut bottom
    g.fillCircle(32, 31, 3, [56, 189, 248]);
    g.drawLine(32, 31, 32, 38, 5, [56, 189, 248]);
    g.fillCircle(32, 47, 3.5, [56, 189, 248]); // dot
  },

  // 5. Mouse Icon
  mouse: (g, w, h) => {
    g.fillRoundRect(20, 12, 24, 40, 12, [226, 232, 240]); // body
    g.drawLine(32, 12, 32, 30, 2, [148, 163, 184]); // line
    g.fillRoundRect(30, 18, 4, 10, 2, [56, 189, 248]); // scroll wheel
  },

  // 6. Moon Icon
  moon: (g, w, h) => {
    g.fillCircle(32, 32, 24, [253, 224, 71]); // yellow circle
    g.fillCircle(42, 26, 22, [15, 23, 42, 0]); // cut out for crescent
    // Eraser / dark side of moon
    for (let y = 0; y < 64; y++) {
      for (let x = 0; x < 64; x++) {
        const dCut = Math.hypot(x - 42, y - 24);
        if (dCut <= 20) {
          // erase pixel
          g.pixel(x, y, 0, 0, 0, 0);
        }
      }
    }
    // Small stars
    g.fillCircle(48, 14, 2, [255, 255, 255]);
    g.fillCircle(54, 32, 2.5, [255, 255, 255]);
    g.fillCircle(46, 50, 1.5, [255, 255, 255]);
  },

  // 7. Telescope Icon
  telescope: (g, w, h) => {
    // Tripod
    g.drawLine(32, 32, 16, 56, 3, [148, 163, 184]);
    g.drawLine(32, 32, 48, 56, 3, [148, 163, 184]);
    g.drawLine(32, 32, 32, 58, 3, [203, 213, 225]);
    // Barrel
    g.drawLine(14, 42, 48, 14, 10, [129, 140, 248]); // indigo body
    g.fillCircle(48, 14, 7, [56, 189, 248]); // lens glow
    g.fillCircle(14, 42, 4, [30, 41, 59]); // eyepiece
  },

  // 8. Satellite Icon
  satellite: (g, w, h) => {
    // Solar panels
    g.fillRoundRect(6, 24, 18, 16, 2, [56, 189, 248]);
    g.fillRoundRect(40, 24, 18, 16, 2, [56, 189, 248]);
    // Grid lines on solar panels
    g.drawLine(15, 24, 15, 40, 1, [15, 23, 42]);
    g.drawLine(49, 24, 49, 40, 1, [15, 23, 42]);
    // Center Bus
    g.fillRoundRect(24, 20, 16, 24, 3, [226, 232, 240]);
    // Dish antenna
    g.fillCircle(32, 12, 8, [245, 158, 11]);
    g.fillCircle(32, 14, 6, [15, 23, 42]);
  },

  // 9. Book / Wiki Icon
  book: (g, w, h) => {
    // Open book pages
    g.fillRoundRect(10, 18, 21, 30, 3, [255, 255, 255]);
    g.fillRoundRect(33, 18, 21, 30, 3, [241, 245, 249]);
    // Cover spine
    g.fillRoundRect(8, 44, 48, 6, 2, [245, 158, 11]);
    // Text lines
    g.drawLine(14, 26, 26, 26, 2, [148, 163, 184]);
    g.drawLine(14, 32, 26, 32, 2, [148, 163, 184]);
    g.drawLine(14, 38, 24, 38, 2, [148, 163, 184]);
    g.drawLine(37, 26, 49, 26, 2, [148, 163, 184]);
    g.drawLine(37, 32, 49, 32, 2, [148, 163, 184]);
    g.drawLine(37, 38, 47, 38, 2, [148, 163, 184]);
  },

  // 10. Beginner / Seedling Icon
  beginner: (g, w, h) => {
    // Stem
    g.drawLine(32, 56, 32, 28, 4, [34, 197, 94]);
    // Left leaf
    g.fillCircle(24, 26, 10, [74, 222, 128]);
    g.fillCircle(28, 30, 8, [15, 23, 42, 0]);
    // Right leaf
    g.fillCircle(40, 22, 11, [34, 197, 94]);
    // Soil
    g.fillRoundRect(16, 52, 32, 8, 4, [120, 53, 15]);
  },

  // 11. Student / Graduation Cap Icon
  student: (g, w, h) => {
    // Cap diamond top
    for (let y = 10; y <= 32; y++) {
      const wRow = (y <= 21 ? (y - 10) * 2 : (32 - y) * 2);
      g.drawLine(32 - wRow, y, 32 + wRow, y, 1, [99, 102, 241]);
    }
    // Skull cap base
    g.fillRoundRect(22, 30, 20, 16, 4, [79, 70, 229]);
    // Tassel
    g.drawLine(44, 22, 52, 36, 2, [245, 158, 11]);
    g.fillCircle(52, 38, 3, [245, 158, 11]);
  },

  // 12. Microscope / Science Icon
  microscope: (g, w, h) => {
    // Base
    g.fillRoundRect(14, 52, 36, 8, 3, [168, 85, 247]);
    // Arm
    g.drawLine(40, 52, 40, 20, 5, [168, 85, 247]);
    g.drawLine(40, 20, 28, 20, 5, [168, 85, 247]);
    // Body tube
    g.drawLine(26, 12, 20, 36, 7, [192, 132, 252]);
    // Lens
    g.fillCircle(19, 39, 4, [56, 189, 248]);
    // Stage
    g.fillRect(14, 42, 20, 4, [226, 232, 240]);
  },

  // 13. Hourglass / Timer Icon
  hourglass: (g, w, h) => {
    // Frame top & bottom
    g.fillRect(16, 10, 32, 6, [245, 158, 11]);
    g.fillRect(16, 48, 32, 6, [245, 158, 11]);
    // Glass body
    g.drawLine(20, 16, 32, 32, 3, [254, 240, 138]);
    g.drawLine(44, 16, 32, 32, 3, [254, 240, 138]);
    g.drawLine(20, 48, 32, 32, 3, [254, 240, 138]);
    g.drawLine(44, 48, 32, 32, 3, [254, 240, 138]);
    // Sand top & bottom
    g.fillCircle(32, 22, 6, [245, 158, 11]);
    g.fillCircle(32, 44, 7, [245, 158, 11]);
  },

  // 14. Warning Icon
  warning: (g, w, h) => {
    // Triangle background
    for (let y = 10; y <= 54; y++) {
      const halfW = (y - 10) * 0.6;
      g.drawLine(32 - halfW, y, 32 + halfW, y, 1, [245, 158, 11]);
    }
    // Exclamation mark
    g.drawLine(32, 22, 32, 38, 4, [15, 23, 42]);
    g.fillCircle(32, 46, 3, [15, 23, 42]);
  },

  // 15. Robot / AI Icon
  robot: (g, w, h) => {
    // Antenna
    g.drawLine(32, 8, 32, 16, 3, [56, 189, 248]);
    g.fillCircle(32, 8, 4, [244, 63, 94]);
    // Head
    g.fillRoundRect(14, 16, 36, 32, 8, [56, 189, 248]);
    // Visor / Eyes
    g.fillRoundRect(20, 24, 24, 10, 4, [15, 23, 42]);
    g.fillCircle(26, 29, 3, [56, 189, 248]);
    g.fillCircle(38, 29, 3, [56, 189, 248]);
    // Mouth grid
    g.drawLine(24, 40, 40, 40, 2, [15, 23, 42]);
    // Ears
    g.fillRoundRect(10, 26, 4, 12, 2, [148, 163, 184]);
    g.fillRoundRect(50, 26, 4, 12, 2, [148, 163, 184]);
  },

  // 16. Check / OK Icon
  check: (g, w, h) => {
    g.fillCircle(32, 32, 24, [34, 197, 94]);
    g.drawLine(18, 32, 28, 42, 5, [255, 255, 255]);
    g.drawLine(28, 42, 46, 20, 5, [255, 255, 255]);
  },

  // 17. Error / Red X Icon
  error: (g, w, h) => {
    g.fillCircle(32, 32, 24, [239, 68, 68]);
    g.drawLine(20, 20, 44, 44, 5, [255, 255, 255]);
    g.drawLine(44, 20, 20, 44, 5, [255, 255, 255]);
  }
};

console.log('Generating PNG icons in assets/icons/...');

for (const [name, fn] of Object.entries(icons)) {
  const pngBuf = createPNG(64, 64, fn);
  const filePath = path.join(ICON_DIR, `${name}.png`);
  fs.writeFileSync(filePath, pngBuf);
  console.log(` Generated: assets/icons/${name}.png (${pngBuf.length} bytes)`);
}

console.log('All PNG icons generated successfully!');
