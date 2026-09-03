import * as THREE from 'three';

/**
 * 3D Starfield & Interstellar Cosmic Nebula Dust Cloud Generator
 */
export class Starfield {
  constructor(scene, count = 4500) {
    this.scene = scene;
    this.count = count;
    this.init();
    this.initNebula();
  }

  init() {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.count * 3);
    const colors = new Float32Array(this.count * 3);
    const sizes = new Float32Array(this.count);

    const radiusInner = 350;
    const radiusOuter = 1200;

    const tempColor = new THREE.Color();

    for (let i = 0; i < this.count; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = radiusInner + Math.pow(Math.random(), 0.5) * (radiusOuter - radiusInner);

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      const colorType = Math.random();
      if (colorType > 0.85) {
        tempColor.setHSL(0.6, 0.7, 0.85); // Blue-white star
      } else if (colorType > 0.7) {
        tempColor.setHSL(0.1, 0.6, 0.85); // Golden star
      } else {
        tempColor.setHSL(0.0, 0.0, Math.random() * 0.4 + 0.6); // White star
      }

      colors[i * 3] = tempColor.r;
      colors[i * 3 + 1] = tempColor.g;
      colors[i * 3 + 2] = tempColor.b;

      sizes[i] = Math.random() * 2.2 + 0.8;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      size: 1.8,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: true
    });

    this.points = new THREE.Points(geometry, material);
    this.scene.add(this.points);
  }

  /**
   * Generates volumetric soft cosmic nebula gas clouds in deep background
   */
  initNebula() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createRadialGradient(256, 256, 10, 256, 256, 250);
    grad.addColorStop(0, 'rgba(56, 189, 248, 0.18)');
    grad.addColorStop(0.4, 'rgba(129, 140, 248, 0.1)');
    grad.addColorStop(0.8, 'rgba(168, 85, 247, 0.03)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    const texture = new THREE.CanvasTexture(canvas);
    const planeGeo = new THREE.PlaneGeometry(600, 600);

    const colors = [0x38bdf8, 0x818cf8, 0xc084fc, 0x0284c7];

    for (let i = 0; i < 8; i++) {
      const planeMat = new THREE.MeshBasicMaterial({
        map: texture,
        color: colors[i % colors.length],
        transparent: true,
        opacity: 0.35,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });

      const nebulaMesh = new THREE.Mesh(planeGeo, planeMat);

      // Position in outer spherical shell
      const r = 700 + Math.random() * 300;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI - Math.PI / 2;

      nebulaMesh.position.set(
        r * Math.cos(phi) * Math.cos(theta),
        r * Math.sin(phi),
        r * Math.cos(phi) * Math.sin(theta)
      );

      nebulaMesh.lookAt(0, 0, 0);
      nebulaMesh.rotation.z = Math.random() * Math.PI;
      nebulaMesh.scale.setScalar(1.0 + Math.random() * 1.5);

      this.scene.add(nebulaMesh);
    }
  }
}
