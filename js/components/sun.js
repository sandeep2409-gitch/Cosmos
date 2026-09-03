import * as THREE from 'three';
import { SUN_CONFIG } from '../config/planetsData.js';
import { TextureGenerator } from './textureGen.js';
import { Shaders } from './shaders.js';

/**
 * Sun Object with Animated Solar Plasma Shader, Corona Glow & Scale Transition Support
 */
export class Sun {
  constructor(scene) {
    this.scene = scene;
    this.config = SUN_CONFIG;
    
    this.targetScale = 1.0;
    this.currentScale = 1.0;
    
    this.init();
  }

  init() {
    this.group = new THREE.Group();
    this.group.name = 'sun-group';

    // 1. Sun Texture & Custom GLSL Surface Material
    const sunTexture = TextureGenerator.getTexture('sun');
    this.sunMaterial = Shaders.createSunMaterial(sunTexture);

    // 2. Sun Sphere Mesh
    const geometry = new THREE.SphereGeometry(this.config.radius, 128, 128);
    this.mesh = new THREE.Mesh(geometry, this.sunMaterial);
    this.mesh.name = 'sun';
    this.mesh.userData = { id: 'sun', ...this.config, type: 'star' };
    this.group.add(this.mesh);

    // 3. Inner Corona Glow Mesh
    const glowGeometry = new THREE.SphereGeometry(this.config.radius * 1.15, 64, 64);
    const glowMaterial = Shaders.createAtmosphereMaterial(0xffbe3b, 3.5, 0.96);
    this.glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    this.group.add(this.glowMesh);

    // 4. Secondary Soft Solar Haze
    const outerGlowGeo = new THREE.SphereGeometry(this.config.radius * 1.28, 32, 32);
    const outerGlowMat = Shaders.createAtmosphereMaterial(0xff9900, 4.5, 0.98);
    this.outerGlow = new THREE.Mesh(outerGlowGeo, outerGlowMat);
    this.group.add(this.outerGlow);

    this.scene.add(this.group);
  }

  setScaleMode(mode = 'visual') {
    if (mode === 'real') {
      this.targetScale = this.config.realRadius / this.config.radius; // ~15.5x scale
    } else {
      this.targetScale = 1.0;
    }
  }

  update(delta) {
    // Smooth Scale Lerp
    if (Math.abs(this.currentScale - this.targetScale) > 0.001) {
      this.currentScale += (this.targetScale - this.currentScale) * 3.0 * delta;
      this.group.scale.setScalar(this.currentScale);
    }

    // Animate solar plasma surface shader time uniform
    if (this.sunMaterial && this.sunMaterial.uniforms.time) {
      this.sunMaterial.uniforms.time.value += delta;
    }

    // Slow rotation
    if (this.mesh) {
      this.mesh.rotation.y += 0.002 * delta * 60;
    }
  }
}
