import * as THREE from 'three';
import { SATELLITES_DATA } from '../config/satellitesData.js';
import { TextureGenerator } from './textureGen.js';

/**
 * Factory & Controller for 3D Natural Satellites (Moons)
 */
export class SatelliteFactory {
  constructor(scene) {
    this.scene = scene;
    this.satellites = [];
    this.orbitsVisible = true;
    this.labelsVisible = true;
  }

  createSatellitesForPlanet(planetConfig, parentPlanetContainer) {
    const moonConfigs = SATELLITES_DATA.filter(s => s.parentPlanetId === planetConfig.id);
    const createdMoons = [];

    moonConfigs.forEach(config => {
      const moonData = this.createSatellite(config, parentPlanetContainer);
      this.satellites.push(moonData);
      createdMoons.push(moonData);
    });

    return createdMoons;
  }

  createSatelliteLabelSprite(name, radius) {
    const canvas = document.createElement('canvas');
    canvas.width = 384;
    canvas.height = 96;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = 'rgba(15, 23, 42, 0.82)';
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
    ctx.lineWidth = 3;
    
    const r = 12;
    const x = 10, y = 10, w = 364, h = 76;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Small cyan dot
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(45, 48, 7, 0, Math.PI * 2);
    ctx.fill();

    // Moon name
    ctx.font = 'bold 28px "Space Grotesk", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(name.toUpperCase(), 70, 48);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const spriteMat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false
    });

    const sprite = new THREE.Sprite(spriteMat);
    const spriteScaleY = 2.2;
    const spriteScaleX = spriteScaleY * (384 / 96);
    sprite.scale.set(spriteScaleX, spriteScaleY, 1);
    sprite.position.set(0, radius + 1.2, 0);

    return sprite;
  }

  createSatellite(config, parentPlanetContainer) {
    // 1. Orbital Pivot Container inside parent planet
    const pivot = new THREE.Group();
    pivot.name = `${config.id}-pivot`;

    // 2. Satellite Container at orbital distance
    const satelliteContainer = new THREE.Group();
    satelliteContainer.position.set(config.distanceFromParent, 0, 0);

    const tiltRad = THREE.MathUtils.degToRad(config.axialTilt);
    satelliteContainer.rotation.z = tiltRad;

    // 3. Moon Mesh
    const geometry = new THREE.SphereGeometry(config.radius, 64, 64);
    const texture = TextureGenerator.getTexture(config.textureType);

    const material = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.8,
      metalness: 0.05
    });

    const moonMesh = new THREE.Mesh(geometry, material);
    moonMesh.name = config.id;
    moonMesh.castShadow = true;
    moonMesh.receiveShadow = true;

    moonMesh.userData = {
      id: config.id,
      name: config.name,
      parentPlanetId: config.parentPlanetId,
      radius: config.radius,
      type: 'satellite',
      ...config
    };

    satelliteContainer.add(moonMesh);

    // 4. 3D WebGL Canvas Sprite Label
    const labelSprite = this.createSatelliteLabelSprite(config.name, config.radius);
    satelliteContainer.add(labelSprite);

    pivot.add(satelliteContainer);
    parentPlanetContainer.add(pivot);

    // 5. Moon Dotted Orbit Line around Parent Planet
    const orbitLine = this.createMoonOrbitLine(config.distanceFromParent);
    parentPlanetContainer.add(orbitLine);

    return {
      config,
      pivot,
      satelliteContainer,
      moonMesh,
      labelSprite,
      orbitLine,
      orbitAngle: Math.random() * Math.PI * 2
    };
  }

  createMoonOrbitLine(radius) {
    const points = [];
    const segments = 128;
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(theta) * radius, 0, Math.sin(theta) * radius));
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineDashedMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.25,
      dashSize: 0.5,
      gapSize: 0.4
    });

    const line = new THREE.LineLoop(geometry, material);
    line.computeLineDistances();
    return line;
  }

  setMoonOrbitPathsVisible(visible) {
    this.orbitsVisible = visible;
    this.satellites.forEach(s => {
      if (s.orbitLine) s.orbitLine.visible = visible;
    });
  }

  setMoonLabelsVisible(visible) {
    this.labelsVisible = visible;
    this.satellites.forEach(s => {
      if (s.labelSprite) s.labelSprite.visible = visible;
    });
  }

  update(delta, timeSpeed = 1.0) {
    const timeFactor = delta * 60 * timeSpeed;

    this.satellites.forEach(s => {
      // Moon orbital motion around parent planet
      s.orbitAngle += s.config.orbitSpeed * 0.015 * timeFactor;
      s.satelliteContainer.position.x = Math.cos(s.orbitAngle) * s.config.distanceFromParent;
      s.satelliteContainer.position.z = Math.sin(s.orbitAngle) * s.config.distanceFromParent;

      // Moon self-rotation
      s.moonMesh.rotation.y += s.config.rotationSpeed * timeFactor;
    });
  }
}
