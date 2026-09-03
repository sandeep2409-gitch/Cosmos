import * as THREE from 'three';

/**
 * 4K Ultra High-Resolution Perlin Noise Generator
 * Expanded for Segment 4 Moon & Satellite Textures.
 */
class PerlinNoise {
  constructor() {
    this.p = new Uint8Array(512);
    const perm = [
      151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,
      21,10,23,190,6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,88,
      237,149,56,87,174,20,125,136,171,168,68,175,74,165,71,134,139,48,27,166,77,146,158,231,
      83,111,229,122,60,211,133,230,220,105,92,41,55,46,245,40,244,102,143,54,65,25,63,161,1,
      216,80,73,209,76,132,187,208,89,18,169,200,196,135,130,116,188,159,86,164,100,109,198,
      173,186,3,64,52,217,226,250,124,123,5,202,38,147,118,126,255,82,85,212,207,206,59,227,
      47,16,58,17,182,189,28,42,223,183,170,213,119,248,152,2,44,154,163,70,221,153,101,155,
      167,43,172,9,129,22,39,253,19,98,108,110,79,113,224,232,178,185,112,104,218,246,97,228,
      251,34,242,193,238,210,144,12,191,179,162,241,81,51,145,235,249,14,239,107,49,192,214,
      31,181,199,106,157,184,84,204,176,115,121,50,45,127,4,150,254,138,236,205,93,222,114,
      67,29,24,72,243,141,128,195,78,66,215,61,156,180
    ];
    for (let i = 0; i < 256; i++) {
      this.p[i] = perm[i];
      this.p[256 + i] = perm[i];
    }
  }

  fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
  lerp(t, a, b) { return a + t * (b - a); }
  grad(hash, x, y, z) {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  noise(x, y, z = 0) {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const Z = Math.floor(z) & 255;
    x -= Math.floor(x);
    y -= Math.floor(y);
    z -= Math.floor(z);
    const u = this.fade(x);
    const v = this.fade(y);
    const w = this.fade(z);
    const A = this.p[X] + Y, AA = this.p[A] + Z, AB = this.p[A + 1] + Z;
    const B = this.p[X + 1] + Y, BA = this.p[B] + Z, BB = this.p[B + 1] + Z;

    return this.lerp(w,
      this.lerp(v,
        this.lerp(u, this.grad(this.p[AA], x, y, z), this.grad(this.p[BA], x - 1, y, z)),
        this.lerp(u, this.grad(this.p[AB], x, y - 1, z), this.grad(this.p[BB], x - 1, y - 1, z))
      ),
      this.lerp(v,
        this.lerp(u, this.grad(this.p[AA + 1], x, y, z - 1), this.grad(this.p[BA + 1], x - 1, y, z - 1)),
        this.lerp(u, this.grad(this.p[AB + 1], x, y - 1, z - 1), this.grad(this.p[BB + 1], x - 1, y - 1, z - 1))
      )
    );
  }

  fBm(x, y, z, octaves = 6, persistence = 0.5) {
    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let maxValue = 0;
    for (let i = 0; i < octaves; i++) {
      total += this.noise(x * frequency, y * frequency, z * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= 2;
    }
    return (total / maxValue + 1) / 2;
  }
}

const perlin = new PerlinNoise();

export class TextureGenerator {
  static createCanvas(width = 2048, height = 1024) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    return { canvas, ctx, width, height };
  }

  static uvTo3D(u, v) {
    const theta = u * Math.PI * 2;
    const phi = (v - 0.5) * Math.PI;
    return {
      x: Math.cos(phi) * Math.cos(theta),
      y: Math.sin(phi),
      z: Math.cos(phi) * Math.sin(theta)
    };
  }

  // --- PLANETS ---
  static generateSunTexture() {
    const { canvas, ctx, width, height } = this.createCanvas(2048, 1024);
    const imgData = ctx.createImageData(width, height);
    const data = imgData.data;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const u = x / width;
        const v = y / height;
        const p3d = this.uvTo3D(u, v);

        const n1 = perlin.fBm(p3d.x * 12, p3d.y * 12, p3d.z * 12, 6, 0.55);
        const n2 = perlin.fBm(p3d.x * 28, p3d.y * 28, p3d.z * 28, 4, 0.5);

        const val = n1 * 0.7 + n2 * 0.3;

        let spot = perlin.fBm(p3d.x * 4 + 10, p3d.y * 4 + 10, p3d.z * 4 + 10, 4, 0.5);
        let spotMask = spot < 0.28 ? Math.pow((0.28 - spot) / 0.28, 1.5) : 0;

        let r = Math.floor(255 * Math.min(1, val * 1.3));
        let g = Math.floor(220 * Math.pow(val, 1.4));
        let b = Math.floor(60 * Math.pow(val, 2.5));

        if (spotMask > 0) {
          r = Math.floor(r * (1 - spotMask * 0.85));
          g = Math.floor(g * (1 - spotMask * 0.95));
          b = Math.floor(b * (1 - spotMask * 0.98));
        }

        const idx = (y * width + x) * 4;
        data[idx] = r; data[idx + 1] = g; data[idx + 2] = b; data[idx + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);
    return new THREE.CanvasTexture(canvas);
  }

  static generateMercuryTexture() {
    const { canvas, ctx, width, height } = this.createCanvas(1024, 512);
    const imgData = ctx.createImageData(width, height);
    const data = imgData.data;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const u = x / width;
        const v = y / height;
        const p3d = this.uvTo3D(u, v);

        const macro = perlin.fBm(p3d.x * 3, p3d.y * 3, p3d.z * 3, 4, 0.5);
        const micro = perlin.fBm(p3d.x * 25, p3d.y * 25, p3d.z * 25, 6, 0.5);

        const val = macro * 0.4 + micro * 0.6;
        const shade = Math.floor(90 + val * 110);

        const idx = (y * width + x) * 4;
        data[idx] = shade; data[idx + 1] = Math.floor(shade * 0.98); data[idx + 2] = Math.floor(shade * 0.95); data[idx + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);
    return new THREE.CanvasTexture(canvas);
  }

  static generateVenusTexture() {
    const { canvas, ctx, width, height } = this.createCanvas(1024, 512);
    const imgData = ctx.createImageData(width, height);
    const data = imgData.data;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const u = x / width;
        const v = y / height;
        const p3d = this.uvTo3D(u, v);

        const n = perlin.fBm(p3d.x * 6 + u * 4, p3d.y * 12, p3d.z * 6, 5, 0.5);
        const val = n * 0.8 + 0.2;

        const r = Math.floor(215 + val * 40);
        const g = Math.floor(175 + val * 55);
        const b = Math.floor(110 + val * 45);

        const idx = (y * width + x) * 4;
        data[idx] = r; data[idx + 1] = g; data[idx + 2] = b; data[idx + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);
    return new THREE.CanvasTexture(canvas);
  }

  static generateEarthTexture() {
    const { canvas, ctx, width, height } = this.createCanvas(2048, 1024);
    ctx.fillStyle = '#123e6b';
    ctx.fillRect(0, 0, width, height);

    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const u = x / width;
        const v = y / height;
        const p3d = this.uvTo3D(u, v);
        const idx = (y * width + x) * 4;

        const n = perlin.fBm(p3d.x * 3.5, p3d.y * 3.5, p3d.z * 3.5, 6, 0.52);
        const isLand = n > 0.48;

        if (isLand) {
          data[idx] = Math.floor(45 + n * 65);
          data[idx + 1] = Math.floor(135 + n * 65);
          data[idx + 2] = Math.floor(55 + n * 35);
        } else {
          data[idx] = 12; data[idx + 1] = 60; data[idx + 2] = 130;
        }
        data[idx + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);
    return new THREE.CanvasTexture(canvas);
  }

  static generateEarthNightTexture() {
    const { canvas, ctx, width, height } = this.createCanvas(1024, 512);
    ctx.fillStyle = '#020408';
    ctx.fillRect(0, 0, width, height);
    return new THREE.CanvasTexture(canvas);
  }

  static generateEarthCloudTexture() {
    const { canvas, ctx, width, height } = this.createCanvas(1024, 512);
    const imgData = ctx.createImageData(width, height);
    const data = imgData.data;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const u = x / width;
        const v = y / height;
        const p3d = this.uvTo3D(u, v);

        let cloud = perlin.fBm(p3d.x * 4, p3d.y * 4, p3d.z * 4, 5, 0.5);
        let alpha = cloud > 0.5 ? (cloud - 0.5) * 2 * 230 : 0;

        const idx = (y * width + x) * 4;
        data[idx] = 255; data[idx + 1] = 255; data[idx + 2] = 255; data[idx + 3] = Math.floor(alpha);
      }
    }
    ctx.putImageData(imgData, 0, 0);
    return new THREE.CanvasTexture(canvas);
  }

  static generateMarsTexture() {
    const { canvas, ctx, width, height } = this.createCanvas(1024, 512);
    const imgData = ctx.createImageData(width, height);
    const data = imgData.data;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const u = x / width;
        const v = y / height;
        const p3d = this.uvTo3D(u, v);

        const n = perlin.fBm(p3d.x * 4, p3d.y * 4, p3d.z * 4, 5, 0.5);

        const idx = (y * width + x) * 4;
        data[idx] = Math.floor(180 + n * 50);
        data[idx + 1] = Math.floor(70 + n * 45);
        data[idx + 2] = Math.floor(20 + n * 25);
        data[idx + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);
    return new THREE.CanvasTexture(canvas);
  }

  static generateJupiterTexture() {
    const { canvas, ctx, width, height } = this.createCanvas(2048, 1024);
    const imgData = ctx.createImageData(width, height);
    const data = imgData.data;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const u = x / width;
        const v = y / height;
        const p3d = this.uvTo3D(u, v);

        const band = Math.sin(v * Math.PI * 18) * 0.5 + 0.5;
        const n = perlin.fBm(p3d.x * 6, p3d.y * 18, p3d.z * 6, 4, 0.5);

        const t = band * 0.6 + n * 0.4;

        const idx = (y * width + x) * 4;
        data[idx] = Math.floor(180 + t * 65);
        data[idx + 1] = Math.floor(125 + t * 55);
        data[idx + 2] = Math.floor(70 + t * 45);
        data[idx + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);
    return new THREE.CanvasTexture(canvas);
  }

  static generateSaturnTexture() {
    const { canvas, ctx, width, height } = this.createCanvas(1024, 512);
    const imgData = ctx.createImageData(width, height);
    const data = imgData.data;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const v = y / height;
        const band = Math.sin(v * Math.PI * 14) * 0.5 + 0.5;

        const idx = (y * width + x) * 4;
        data[idx] = Math.floor(215 + band * 35);
        data[idx + 1] = Math.floor(190 + band * 30);
        data[idx + 2] = Math.floor(135 + band * 25);
        data[idx + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);
    return new THREE.CanvasTexture(canvas);
  }

  static generateSaturnRingsTexture() {
    const { canvas, ctx, width, height } = this.createCanvas(1024, 32);
    const imgData = ctx.createImageData(width, height);
    const data = imgData.data;

    for (let x = 0; x < width; x++) {
      const normX = x / width;
      let opacity = normX > 0.1 && normX < 0.9 ? 0.75 : 0;
      for (let y = 0; y < height; y++) {
        const idx = (y * width + x) * 4;
        data[idx] = 220; data[idx + 1] = 200; data[idx + 2] = 160; data[idx + 3] = Math.floor(opacity * 255);
      }
    }
    ctx.putImageData(imgData, 0, 0);
    return new THREE.CanvasTexture(canvas);
  }

  static generateUranusTexture() {
    const { canvas, ctx, width, height } = this.createCanvas(1024, 512);
    ctx.fillStyle = '#4b70dd';
    ctx.fillRect(0, 0, width, height);
    return new THREE.CanvasTexture(canvas);
  }

  static generateUranusRingsTexture() {
    const { canvas, ctx } = this.createCanvas(512, 16);
    ctx.fillStyle = 'rgba(180, 220, 245, 0.4)';
    ctx.fillRect(0, 0, 512, 16);
    return new THREE.CanvasTexture(canvas);
  }

  static generateNeptuneTexture() {
    const { canvas, ctx, width, height } = this.createCanvas(1024, 512);
    ctx.fillStyle = '#274687';
    ctx.fillRect(0, 0, width, height);
    return new THREE.CanvasTexture(canvas);
  }

  // --- SATELLITES & MOONS (Segment 4) ---
  static generateMoonTexture() {
    const { canvas, ctx, width, height } = this.createCanvas(1024, 512);
    const imgData = ctx.createImageData(width, height);
    const data = imgData.data;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const u = x / width;
        const v = y / height;
        const p3d = this.uvTo3D(u, v);

        const n = perlin.fBm(p3d.x * 6, p3d.y * 6, p3d.z * 6, 6, 0.5);
        const shade = Math.floor(130 + n * 90);

        const idx = (y * width + x) * 4;
        data[idx] = shade; data[idx + 1] = shade; data[idx + 2] = shade; data[idx + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);
    return new THREE.CanvasTexture(canvas);
  }

  static generateIoTexture() {
    const { canvas, ctx, width, height } = this.createCanvas(1024, 512);
    const imgData = ctx.createImageData(width, height);
    const data = imgData.data;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const u = x / width;
        const v = y / height;
        const p3d = this.uvTo3D(u, v);

        const n = perlin.fBm(p3d.x * 8, p3d.y * 8, p3d.z * 8, 5, 0.5);

        const r = Math.floor(210 + n * 45);
        const g = Math.floor(140 + n * 60);
        const b = Math.floor(20 + n * 30);

        const idx = (y * width + x) * 4;
        data[idx] = r; data[idx + 1] = g; data[idx + 2] = b; data[idx + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);
    return new THREE.CanvasTexture(canvas);
  }

  static generateEuropaTexture() {
    const { canvas, ctx, width, height } = this.createCanvas(1024, 512);
    ctx.fillStyle = '#e0f2fe';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(180, 80, 40, 0.5)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 40; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * width, Math.random() * height);
      ctx.lineTo(Math.random() * width, Math.random() * height);
      ctx.stroke();
    }
    return new THREE.CanvasTexture(canvas);
  }

  static generateTitanTexture() {
    const { canvas, ctx, width, height } = this.createCanvas(1024, 512);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(0, 0, width, height);
    return new THREE.CanvasTexture(canvas);
  }

  static generateEnceladusTexture() {
    const { canvas, ctx, width, height } = this.createCanvas(1024, 512);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    return new THREE.CanvasTexture(canvas);
  }

  static generateTritonTexture() {
    const { canvas, ctx, width, height } = this.createCanvas(1024, 512);
    ctx.fillStyle = '#34d399';
    ctx.fillRect(0, 0, width, height);
    return new THREE.CanvasTexture(canvas);
  }

  static generatePhobosTexture() {
    const { canvas, ctx, width, height } = this.createCanvas(512, 256);
    const imgData = ctx.createImageData(width, height);
    const data = imgData.data;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const u = x / width;
        const v = y / height;
        const p3d = this.uvTo3D(u, v);

        const n = perlin.fBm(p3d.x * 10, p3d.y * 10, p3d.z * 10, 5, 0.5);
        const shade = Math.floor(70 + n * 60);

        const idx = (y * width + x) * 4;
        data[idx] = shade; data[idx + 1] = Math.floor(shade * 0.95); data[idx + 2] = Math.floor(shade * 0.9); data[idx + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);
    return new THREE.CanvasTexture(canvas);
  }

  static getTexture(type) {
    switch (type) {
      case 'sun': return this.generateSunTexture();
      case 'mercury': return this.generateMercuryTexture();
      case 'venus': return this.generateVenusTexture();
      case 'earth': return this.generateEarthTexture();
      case 'earthNight': return this.generateEarthNightTexture();
      case 'earthClouds': return this.generateEarthCloudTexture();
      case 'mars': return this.generateMarsTexture();
      case 'jupiter': return this.generateJupiterTexture();
      case 'saturn': return this.generateSaturnTexture();
      case 'saturnRings': return this.generateSaturnRingsTexture();
      case 'uranus': return this.generateUranusTexture();
      case 'uranusRings': return this.generateUranusRingsTexture();
      case 'neptune': return this.generateNeptuneTexture();
      // Moons
      case 'moon': return this.generateMoonTexture();
      case 'io': return this.generateIoTexture();
      case 'europa': return this.generateEuropaTexture();
      case 'titan': return this.generateTitanTexture();
      case 'enceladus': return this.generateEnceladusTexture();
      case 'triton': return this.generateTritonTexture();
      case 'phobos': return this.generatePhobosTexture();
      default: return this.generateMoonTexture();
    }
  }
}
