import * as THREE from 'three';
import { PLANETS_DATA } from '../config/planetsData.js';
import { TextureGenerator } from './textureGen.js';
import { Shaders } from './shaders.js';

/**
 * Factory and Controller for 3D High-Poly Planets, Real AU Scaling & Display Toggles
 */
export class PlanetFactory {
  constructor(scene) {
    this.scene = scene;
    this.planets = [];
    this.scaleMode = 'visual'; // 'visual' vs 'real'
    this.orbitsVisible = true;
    this.labelsVisible = true;

    this.init();
  }

  init() {
    PLANETS_DATA.forEach(config => {
      const planetData = this.createPlanet(config);
      this.planets.push(planetData);
    });
  }

  createPlanetLabelSprite(name, radius) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = 'rgba(8, 15, 30, 0.85)';
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
    ctx.lineWidth = 4;
    
    const r = 16;
    const x = 20, y = 20, w = 472, h = 88;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(60, 64, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.font = 'bold 36px "Space Grotesk", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(name.toUpperCase(), 95, 64);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const spriteMat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false
    });

    const sprite = new THREE.Sprite(spriteMat);
    const spriteScaleY = 3.5;
    const spriteScaleX = spriteScaleY * (512 / 128);
    sprite.scale.set(spriteScaleX, spriteScaleY, 1);

    const labelY = radius + (name.toLowerCase() === 'saturn' ? 4.5 : 2.5);
    sprite.position.set(0, labelY, 0);

    return sprite;
  }

  createPlanet(config) {
    const pivot = new THREE.Group();
    pivot.name = `${config.id}-pivot`;

    const planetContainer = new THREE.Group();
    planetContainer.position.set(config.distance, 0, 0);

    const tiltRad = THREE.MathUtils.degToRad(config.axialTilt);
    planetContainer.rotation.z = tiltRad;

    const geometry = new THREE.SphereGeometry(config.radius, 128, 128);
    const texture = TextureGenerator.getTexture(config.textureType);

    let material;

    if (config.id === 'earth') {
      const nightTexture = TextureGenerator.getTexture('earthNight');
      const cloudTexture = TextureGenerator.getTexture('earthClouds');
      const sunPos = new THREE.Vector3(0, 0, 0);

      material = Shaders.createEarthDayNightMaterial(texture, nightTexture, cloudTexture, sunPos);
    } else {
      const materialConfig = {
        map: texture,
        roughness: 0.7,
        metalness: 0.05
      };

      if (config.id === 'mercury' || config.id === 'mars') {
        materialConfig.bumpMap = texture;
        materialConfig.bumpScale = 0.15;
      }

      material = new THREE.MeshStandardMaterial(materialConfig);
    }

    const planetMesh = new THREE.Mesh(geometry, material);
    planetMesh.name = config.id;
    planetMesh.castShadow = true;
    planetMesh.receiveShadow = true;

    planetMesh.userData = {
      id: config.id,
      name: config.name,
      radius: config.radius,
      distance: config.distance,
      type: 'planet'
    };

    planetContainer.add(planetMesh);

    let cloudMesh = null;
    if (config.id === 'earth') {
      const cloudTexture = TextureGenerator.getTexture('earthClouds');
      const cloudGeo = new THREE.SphereGeometry(config.radius * 1.018, 128, 128);
      const cloudMat = new THREE.MeshStandardMaterial({
        map: cloudTexture,
        transparent: true,
        opacity: 0.85,
        blending: THREE.NormalBlending
      });
      cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
      cloudMesh.castShadow = true;
      planetContainer.add(cloudMesh);
    }

    if (config.hasAtmosphere || config.color) {
      const atmosphereGeo = new THREE.SphereGeometry(config.radius * 1.06, 64, 64);
      const atmosColor = config.atmosphereColor || config.color;
      const atmosphereMat = Shaders.createAtmosphereMaterial(
        atmosColor,
        config.id === 'earth' ? 3.5 : 4.5,
        0.95
      );
      const atmosphereMesh = new THREE.Mesh(atmosphereGeo, atmosphereMat);
      planetContainer.add(atmosphereMesh);
    }

    if (config.hasRings && config.ringConfig) {
      const ringGeo = new THREE.RingGeometry(
        config.ringConfig.innerRadius,
        config.ringConfig.outerRadius,
        128
      );

      const pos = ringGeo.attributes.position;
      const uvs = ringGeo.attributes.uv;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const distance = Math.sqrt(x * x + y * y);
        const u = (distance - config.ringConfig.innerRadius) / (config.ringConfig.outerRadius - config.ringConfig.innerRadius);
        uvs.setXY(i, u, 0.5);
      }

      const ringTexture = TextureGenerator.getTexture(config.ringConfig.textureType);
      const ringMat = new THREE.MeshStandardMaterial({
        map: ringTexture,
        side: THREE.DoubleSide,
        transparent: true,
        roughness: 0.4
      });

      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = Math.PI / 2;
      ringMesh.castShadow = true;
      ringMesh.receiveShadow = true;
      planetContainer.add(ringMesh);
    }

    const labelSprite = this.createPlanetLabelSprite(config.name, config.radius);
    planetContainer.add(labelSprite);

    pivot.add(planetContainer);
    this.scene.add(pivot);

    const orbitLine = this.createOrbitLine(config.distance, config.orbitColor);
    this.scene.add(orbitLine);

    return {
      config,
      pivot,
      planetContainer,
      planetMesh,
      cloudMesh,
      labelSprite,
      orbitLine,
      currentDistance: config.distance,
      targetDistance: config.distance,
      currentRadius: config.radius,
      targetRadius: config.radius,
      orbitAngle: Math.random() * Math.PI * 2
    };
  }

  createOrbitLine(radius, color = 0x475569) {
    const points = [];
    const segments = 256;
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(theta) * radius, 0, Math.sin(theta) * radius));
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.35,
      linewidth: 1
    });

    const line = new THREE.LineLoop(geometry, material);
    return line;
  }

  updateOrbitLine(orbitLine, radius) {
    const points = [];
    const segments = 256;
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(theta) * radius, 0, Math.sin(theta) * radius));
    }
    orbitLine.geometry.setFromPoints(points);
  }

  setScaleMode(mode = 'visual') {
    this.scaleMode = mode;
    this.planets.forEach(p => {
      if (mode === 'real') {
        p.targetDistance = p.config.realDistance;
        p.targetRadius = p.config.realRadius;
      } else {
        p.targetDistance = p.config.distance;
        p.targetRadius = p.config.radius;
      }
    });
  }

  setOrbitPathsVisible(visible) {
    this.orbitsVisible = visible;
    this.planets.forEach(p => {
      if (p.orbitLine) p.orbitLine.visible = visible;
    });
  }

  setPlanetLabelsVisible(visible) {
    this.labelsVisible = visible;
    this.planets.forEach(p => {
      if (p.labelSprite) p.labelSprite.visible = visible;
    });
  }

  update(delta, timeSpeed = 1.0) {
    const timeFactor = delta * 60 * timeSpeed;

    this.planets.forEach(p => {
      // Lerp distance & radius
      if (Math.abs(p.currentDistance - p.targetDistance) > 0.05) {
        p.currentDistance += (p.targetDistance - p.currentDistance) * 3.0 * delta;
        this.updateOrbitLine(p.orbitLine, p.currentDistance);
      }

      if (Math.abs(p.currentRadius - p.targetRadius) > 0.01) {
        p.currentRadius += (p.targetRadius - p.currentRadius) * 3.0 * delta;
        const scaleFactor = p.currentRadius / p.config.radius;
        p.planetContainer.scale.setScalar(scaleFactor);
        p.planetMesh.userData.radius = p.currentRadius;
      }

      // Orbital movement
      p.orbitAngle += p.config.orbitSpeed * 0.005 * timeFactor;
      p.planetContainer.position.x = Math.cos(p.orbitAngle) * p.currentDistance;
      p.planetContainer.position.z = Math.sin(p.orbitAngle) * p.currentDistance;

      // Planet rotation
      p.planetMesh.rotation.y += p.config.rotationSpeed * timeFactor;

      // Earth Cloud rotation
      if (p.cloudMesh) {
        p.cloudMesh.rotation.y += p.config.rotationSpeed * 1.25 * timeFactor;
      }
    });
  }
}
