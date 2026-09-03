import * as THREE from 'three';

/**
 * 4K Ultra High-Resolution Perlin Noise & Earth Night City Lights Generator
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

  /**
   * Photorealistic Sun Texture
   */
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
        data[idx] = r;
        data[idx + 1] = g;
        data[idx + 2] = b;
        data[idx + 3] = 255;
      }
    }

    ctx.putImageData(imgData, 0, 0);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    return texture;
  }

  /**
   * Mercury Texture
   */
  static generateMercuryTexture() {
    const { canvas, ctx, width, height } = this.createCanvas(2048, 1024);
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
        data[idx] = shade;
        data[idx + 1] = Math.floor(shade * 0.98);
        data[idx + 2] = Math.floor(shade * 0.95);
        data[idx + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    for (let i = 0; i < 140; i++) {
      const cx = Math.random() * width;
      const cy = Math.random() * height;
      const cr = Math.random() * 15 + 2;

      ctx.beginPath();
      ctx.arc(cx, cy, cr, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(40, 40, 40, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    return new THREE.CanvasTexture(canvas);
  }

  /**
   * Venus Texture
   */
  static generateVenusTexture() {
    const { canvas, ctx, width, height } = this.createCanvas(2048, 1024);
    const imgData = ctx.createImageData(width, height);
    const data = imgData.data;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const u = x / width;
        const v = y / height;
        const p3d = this.uvTo3D(u, v);

        const n = perlin.fBm(p3d.x * 6 + u * 4, p3d.y * 12, p3d.z * 6, 5, 0.5);
        const swirl = Math.sin(v * Math.PI * 8 + n * 4);

        const val = n * 0.6 + (swirl * 0.5 + 0.5) * 0.4;

        const r = Math.floor(215 + val * 40);
        const g = Math.floor(175 + val * 55);
        const b = Math.floor(110 + val * 45);

        const idx = (y * width + x) * 4;
        data[idx] = r;
        data[idx + 1] = g;
        data[idx + 2] = b;
        data[idx + 3] = 255;
      }
    }

    ctx.putImageData(imgData, 0, 0);
    return new THREE.CanvasTexture(canvas);
  }

  /**
   * Earth Day World Map Texture
   */
  static generateEarthTexture() {
    const { canvas, ctx, width, height } = this.createCanvas(4096, 2048);

    // Ocean Base
    const oceanGrad = ctx.createLinearGradient(0, 0, 0, height);
    oceanGrad.addColorStop(0, '#0c2440');
    oceanGrad.addColorStop(0.5, '#123e6b');
    oceanGrad.addColorStop(1, '#0a1d33');
    ctx.fillStyle = oceanGrad;
    ctx.fillRect(0, 0, width, height);

    // Landmask Canvas
    const landCanvas = document.createElement('canvas');
    landCanvas.width = width;
    landCanvas.height = height;
    const lCtx = landCanvas.getContext('2d');
    lCtx.fillStyle = '#ffffff';

    const drawPath = (points) => {
      lCtx.beginPath();
      points.forEach((p, idx) => {
        const x = (p[0] / 360 + 0.5) * width;
        const y = (0.5 - p[1] / 180) * height;
        if (idx === 0) lCtx.moveTo(x, y);
        else lCtx.lineTo(x, y);
      });
      lCtx.closePath();
      lCtx.fill();
    };

    // Continent contours
    drawPath([[-168, 65], [-140, 70], [-120, 75], [-85, 78], [-60, 60], [-55, 48], [-65, 44], [-75, 35], [-80, 25], [-90, 16], [-100, 18], [-115, 30], [-125, 48], [-140, 60], [-168, 65]]);
    drawPath([[-115, 32], [-100, 20], [-90, 14], [-82, 8], [-77, 8], [-82, 14], [-98, 26], [-115, 32]]);
    drawPath([[-55, 60], [-20, 70], [-18, 82], [-50, 83], [-70, 75], [-55, 60]]);
    drawPath([[-77, 8], [-60, 10], [-35, -5], [-35, -15], [-50, -35], [-68, -54], [-75, -45], [-72, -30], [-80, -5], [-77, 8]]);
    drawPath([[-10, 36], [0, 43], [5, 50], [10, 54], [25, 60], [30, 70], [15, 58], [5, 52], [-5, 48], [-10, 42], [-10, 36]]);
    drawPath([[5, 58], [15, 56], [28, 70], [20, 71], [10, 62], [5, 58]]);
    drawPath([[-17, 32], [10, 37], [32, 31], [43, 12], [51, 11], [40, -10], [33, -28], [20, -35], [12, -30], [8, 5], [-18, 15], [-17, 32]]);
    drawPath([[44, -12], [50, -15], [47, -25], [43, -24], [44, -12]]);
    drawPath([[30, 40], [45, 30], [55, 25], [60, 12], [70, 20], [78, 8], [88, 22], [100, 10], [105, 20], [120, 22], [122, 10], [130, 25], [140, 35], [145, 45], [170, 60], [180, 70], [100, 75], [50, 70], [35, 55], [30, 40]]);
    drawPath([[70, 22], [78, 8], [88, 22], [75, 30], [70, 22]]);
    drawPath([[130, 31], [140, 38], [142, 44], [136, 35], [130, 31]]);
    drawPath([[114, -22], [130, -12], [142, -11], [153, -28], [148, -38], [138, -35], [115, -34], [114, -22]]);
    drawPath([[-180, -65], [180, -65], [180, -90], [-180, -90]]);

    const lImgData = lCtx.getImageData(0, 0, width, height);
    const lData = lImgData.data;

    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const u = x / width;
        const v = y / height;
        const p3d = this.uvTo3D(u, v);
        const idx = (y * width + x) * 4;

        const isLand = lData[idx] > 128;
        const n = perlin.fBm(p3d.x * 4, p3d.y * 4, p3d.z * 4, 6, 0.52);
        const latAbs = Math.abs(v - 0.5) * 2;

        let r, g, b;

        if (latAbs > 0.82) {
          r = 245; g = 250; b = 255;
        } else if (isLand) {
          if (latAbs < 0.35 && u > 0.45 && u < 0.65 && n > 0.4) {
            r = Math.floor(205 + n * 35); g = Math.floor(170 + n * 30); b = Math.floor(105 + n * 20);
          } else if (n > 0.62) {
            r = Math.floor(140 + n * 90); g = Math.floor(135 + n * 90); b = Math.floor(130 + n * 95);
          } else {
            r = Math.floor(35 + n * 45); g = Math.floor(125 + n * 55); b = Math.floor(45 + n * 25);
          }
        } else {
          const oceanDepth = perlin.fBm(p3d.x * 3, p3d.y * 3, p3d.z * 3, 3, 0.5);
          r = Math.floor(10 + oceanDepth * 20); g = Math.floor(45 + oceanDepth * 55); b = Math.floor(115 + oceanDepth * 70);
        }

        data[idx] = r; data[idx + 1] = g; data[idx + 2] = b; data[idx + 3] = 255;
      }
    }

    ctx.putImageData(imgData, 0, 0);
    return new THREE.CanvasTexture(canvas);
  }

  /**
   * Earth Night City Lights Map (Golden Urban Grid)
   */
  static generateEarthNightTexture() {
    const { canvas, ctx, width, height } = this.createCanvas(2048, 1024);
    ctx.fillStyle = '#020408';
    ctx.fillRect(0, 0, width, height);

    // Draw City Lights clusters (North America east coast, Europe, India, East Asia, Japan)
    const drawCityCluster = (cx, cy, radius, density = 40) => {
      for (let i = 0; i < density; i++) {
        const x = cx + (Math.random() - 0.5) * radius;
        const y = cy + (Math.random() - 0.5) * radius;
        const r = Math.random() * 2 + 1;
        const opacity = Math.random() * 0.8 + 0.2;
        
        ctx.fillStyle = Math.random() > 0.3 ? `rgba(255, 195, 80, ${opacity})` : `rgba(255, 140, 30, ${opacity})`;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    // North America East Coast & Midwest
    drawCityCluster(550, 350, 180, 120);
    drawCityCluster(480, 380, 140, 80);

    // Europe (London, Paris, Berlin, Rome)
    drawCityCluster(1050, 320, 200, 200);
    drawCityCluster(1120, 340, 150, 100);

    // India & Middle East
    drawCityCluster(1420, 480, 160, 150);
    drawCityCluster(1280, 440, 120, 90);

    // East Asia & Japan
    drawCityCluster(1650, 400, 220, 250);
    drawCityCluster(1830, 380, 100, 120);

    // South America & Australia coasts
    drawCityCluster(680, 720, 120, 60);
    drawCityCluster(1820, 780, 100, 50);

    return new THREE.CanvasTexture(canvas);
  }

  /**
   * Earth Cloud Texture
   */
  static generateEarthCloudTexture() {
    const { canvas, ctx, width, height } = this.createCanvas(2048, 1024);
    const imgData = ctx.createImageData(width, height);
    const data = imgData.data;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const u = x / width;
        const v = y / height;
        const p3d = this.uvTo3D(u, v);

        let cloud = perlin.fBm(p3d.x * 4 + u * 2, p3d.y * 4, p3d.z * 4, 6, 0.5);
        let alpha = cloud > 0.48 ? Math.pow((cloud - 0.48) / 0.52, 1.2) * 230 : 0;

        const idx = (y * width + x) * 4;
        data[idx] = 255;
        data[idx + 1] = 255;
        data[idx + 2] = 255;
        data[idx + 3] = Math.floor(Math.min(255, alpha));
      }
    }

    ctx.putImageData(imgData, 0, 0);
    return new THREE.CanvasTexture(canvas);
  }

  /**
   * Mars Texture
   */
  static generateMarsTexture() {
    const { canvas, ctx, width, height } = this.createCanvas(2048, 1024);
    const imgData = ctx.createImageData(width, height);
    const data = imgData.data;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const u = x / width;
        const v = y / height;
        const p3d = this.uvTo3D(u, v);

        const n = perlin.fBm(p3d.x * 4, p3d.y * 4, p3d.z * 4, 6, 0.52);
        const darkBasalt = perlin.fBm(p3d.x * 1.5, p3d.y * 1.5, p3d.z * 1.5, 4, 0.5);

        const latAbs = Math.abs(v - 0.5) * 2;

        let r, g, b;

        if (latAbs > 0.88) {
          r = 245; g = 245; b = 250;
        } else {
          let baseR = 190 + n * 50;
          let baseG = 70 + n * 45;
          let baseB = 20 + n * 25;

          if (darkBasalt < 0.42) {
            const darkFactor = 0.55 + darkBasalt;
            baseR *= darkFactor;
            baseG *= darkFactor;
            baseB *= darkFactor;
          }

          r = Math.floor(baseR);
          g = Math.floor(baseG);
          b = Math.floor(baseB);
        }

        const idx = (y * width + x) * 4;
        data[idx] = r;
        data[idx + 1] = g;
        data[idx + 2] = b;
        data[idx + 3] = 255;
      }
    }

    ctx.putImageData(imgData, 0, 0);
    return new THREE.CanvasTexture(canvas);
  }

  /**
   * Jupiter Texture
   */
  static generateJupiterTexture() {
    const { canvas, ctx, width, height } = this.createCanvas(4096, 2048);
    const imgData = ctx.createImageData(width, height);
    const data = imgData.data;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const u = x / width;
        const v = y / height;
        const p3d = this.uvTo3D(u, v);

        const warp = perlin.fBm(p3d.x * 3 + u * 5, p3d.y * 12, p3d.z * 3, 5, 0.5);
        const yWarp = v + (warp - 0.5) * 0.08;

        const bandFreq = Math.sin(yWarp * Math.PI * 18);
        const bandNoise = perlin.fBm(p3d.x * 8, p3d.y * 20, p3d.z * 8, 4, 0.5);

        const t = bandFreq * 0.5 + bandNoise * 0.5;

        let r = Math.floor(180 + t * 65);
        let g = Math.floor(125 + t * 55);
        let b = Math.floor(70 + t * 45);

        const dx = (u - 0.65) * 3.5;
        const dy = (v - 0.66) * 6.0;
        const distSpot = Math.sqrt(dx * dx + dy * dy);

        if (distSpot < 0.35) {
          const spotFactor = Math.pow(1 - distSpot / 0.35, 1.2);
          const spotSpiral = perlin.fBm(dx * 10, dy * 10, 0, 4, 0.5);

          r = Math.floor(r * (1 - spotFactor) + (225 + spotSpiral * 30) * spotFactor);
          g = Math.floor(g * (1 - spotFactor) + (55 + spotSpiral * 20) * spotFactor);
          b = Math.floor(b * (1 - spotFactor) + (25 + spotSpiral * 15) * spotFactor);
        }

        const idx = (y * width + x) * 4;
        data[idx] = Math.min(255, r);
        data[idx + 1] = Math.min(255, g);
        data[idx + 2] = Math.min(255, b);
        data[idx + 3] = 255;
      }
    }

    ctx.putImageData(imgData, 0, 0);
    return new THREE.CanvasTexture(canvas);
  }

  /**
   * Saturn Texture
   */
  static generateSaturnTexture() {
    const { canvas, ctx, width, height } = this.createCanvas(2048, 1024);
    const imgData = ctx.createImageData(width, height);
    const data = imgData.data;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const u = x / width;
        const v = y / height;
        const p3d = this.uvTo3D(u, v);

        const n = perlin.fBm(p3d.x * 2, p3d.y * 18, p3d.z * 2, 4, 0.5);
        const band = Math.sin(v * Math.PI * 14 + n * 1.5) * 0.5 + 0.5;

        const r = Math.floor(215 + band * 35);
        const g = Math.floor(190 + band * 30);
        const b = Math.floor(135 + band * 25);

        const idx = (y * width + x) * 4;
        data[idx] = r;
        data[idx + 1] = g;
        data[idx + 2] = b;
        data[idx + 3] = 255;
      }
    }

    ctx.putImageData(imgData, 0, 0);
    return new THREE.CanvasTexture(canvas);
  }

  /**
   * Saturn Rings Texture
   */
  static generateSaturnRingsTexture() {
    const { canvas, ctx, width, height } = this.createCanvas(4096, 64);
    const imgData = ctx.createImageData(width, height);
    const data = imgData.data;

    for (let x = 0; x < width; x++) {
      const normX = x / width;

      let opacity = 0;
      let r = 210, g = 190, b = 150;

      if (normX > 0.05 && normX < 0.95) {
        const ringNoise = perlin.fBm(normX * 120, 0, 0, 4, 0.5);

        if (normX > 0.52 && normX < 0.60) {
          opacity = 0.05;
        } else if (normX > 0.88 && normX < 0.90) {
          opacity = 0.08;
        } else if (normX < 0.25) {
          opacity = 0.35 + ringNoise * 0.25;
        } else if (normX >= 0.25 && normX <= 0.52) {
          opacity = 0.85 + ringNoise * 0.15;
          r = 230; g = 210; b = 165;
        } else {
          opacity = 0.65 + ringNoise * 0.2;
        }
      }

      for (let y = 0; y < height; y++) {
        const idx = (y * width + x) * 4;
        data[idx] = r;
        data[idx + 1] = g;
        data[idx + 2] = b;
        data[idx + 3] = Math.floor(opacity * 255);
      }
    }

    ctx.putImageData(imgData, 0, 0);
    return new THREE.CanvasTexture(canvas);
  }

  /**
   * Uranus Texture
   */
  static generateUranusTexture() {
    const { canvas, ctx, width, height } = this.createCanvas(2048, 1024);
    const imgData = ctx.createImageData(width, height);
    const data = imgData.data;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const u = x / width;
        const v = y / height;
        const p3d = this.uvTo3D(u, v);

        const n = perlin.fBm(p3d.x * 2, p3d.y * 6, p3d.z * 2, 4, 0.5);

        const r = Math.floor(100 + n * 30);
        const g = Math.floor(190 + n * 35);
        const b = Math.floor(220 + n * 25);

        const idx = (y * width + x) * 4;
        data[idx] = r;
        data[idx + 1] = g;
        data[idx + 2] = b;
        data[idx + 3] = 255;
      }
    }

    ctx.putImageData(imgData, 0, 0);
    return new THREE.CanvasTexture(canvas);
  }

  /**
   * Uranus Rings Texture
   */
  static generateUranusRingsTexture() {
    const { canvas, ctx } = this.createCanvas(1024, 32);
    const grad = ctx.createLinearGradient(0, 0, 1024, 0);
    grad.addColorStop(0.0, 'rgba(0,0,0,0)');
    grad.addColorStop(0.4, 'rgba(140, 200, 230, 0.25)');
    grad.addColorStop(0.7, 'rgba(180, 220, 245, 0.45)');
    grad.addColorStop(1.0, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 32);
    return new THREE.CanvasTexture(canvas);
  }

  /**
   * Neptune Texture
   */
  static generateNeptuneTexture() {
    const { canvas, ctx, width, height } = this.createCanvas(2048, 1024);
    const imgData = ctx.createImageData(width, height);
    const data = imgData.data;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const u = x / width;
        const v = y / height;
        const p3d = this.uvTo3D(u, v);

        const n = perlin.fBm(p3d.x * 3, p3d.y * 8, p3d.z * 3, 5, 0.5);
        const cirrus = perlin.fBm(p3d.x * 15, p3d.y * 2, p3d.z * 15, 3, 0.5);

        let r = 25 + n * 30;
        let g = 65 + n * 45;
        let b = 170 + n * 65;

        if (cirrus > 0.65) {
          const cFactor = (cirrus - 0.65) / 0.35;
          r += cFactor * 160;
          g += cFactor * 170;
          b += cFactor * 80;
        }

        const idx = (y * width + x) * 4;
        data[idx] = Math.floor(Math.min(255, r));
        data[idx + 1] = Math.floor(Math.min(255, g));
        data[idx + 2] = Math.floor(Math.min(255, b));
        data[idx + 3] = 255;
      }
    }

    ctx.putImageData(imgData, 0, 0);
    return new THREE.CanvasTexture(canvas);
  }

  /**
   * Master Texture Dispatcher
   */
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
      default: return null;
    }
  }
}
