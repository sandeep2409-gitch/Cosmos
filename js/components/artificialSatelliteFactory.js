import * as THREE from 'three';
import { ARTIFICIAL_SATELLITES_DATA } from '../config/artificialSatellitesData.js';

/**
 * Factory & Controller for 3D Artificial Satellites & Spacecraft (Segment 4)
 * Generates procedural low-poly spacecraft templates and manages contextual planet focus visibility.
 */
export class ArtificialSatelliteFactory {
  constructor(scene) {
    this.scene = scene;
    this.spacecraftList = [];
    this.activeParentId = null; // null = overview mode (hide spacecraft orbits & labels)
    this.layerVisibility = {
      moons: true,
      pioneers: true,
      'earth-sats': true,
      'deep-space': true,
      constellations: true
    };
    this.orbitsVisible = true;
    this.labelsVisible = true;
  }

  createSpacecraftForParent(parentConfig, parentContainer) {
    const satConfigs = ARTIFICIAL_SATELLITES_DATA.filter(s => s.parentBodyId === parentConfig.id);
    const createdSats = [];

    satConfigs.forEach(config => {
      const satData = this.createSpacecraft(config, parentContainer);
      this.spacecraftList.push(satData);
      createdSats.push(satData);
    });

    return createdSats;
  }

  createSpacecraftModel(template, colorHex = 0x38bdf8) {
    const group = new THREE.Group();

    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xd1d5db,
      metalness: 0.8,
      roughness: 0.2
    });

    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.9,
      roughness: 0.1
    });

    const solarMat = new THREE.MeshStandardMaterial({
      color: 0x1e3a8a,
      roughness: 0.3,
      metalness: 0.6
    });

    const accentMat = new THREE.MeshStandardMaterial({
      color: colorHex,
      emissive: colorHex,
      emissiveIntensity: 0.4
    });

    if (template === 'pioneer') {
      const sphereGeo = new THREE.SphereGeometry(0.35, 16, 16);
      const sphereMesh = new THREE.Mesh(sphereGeo, goldMat);
      group.add(sphereMesh);

      for (let i = 0; i < 4; i++) {
        const antennaGeo = new THREE.CylinderGeometry(0.02, 0.02, 1.4, 8);
        const antennaMesh = new THREE.Mesh(antennaGeo, bodyMat);
        antennaMesh.rotation.z = Math.PI / 4 + (i * Math.PI / 2);
        antennaMesh.rotation.y = (i * Math.PI / 2);
        antennaMesh.position.set(0, 0, 0);
        group.add(antennaMesh);
      }
    } else if (template === 'telescope') {
      const barrelGeo = new THREE.CylinderGeometry(0.3, 0.3, 1.0, 16);
      const barrelMesh = new THREE.Mesh(barrelGeo, bodyMat);
      barrelMesh.rotation.z = Math.PI / 2;
      group.add(barrelMesh);

      const ringGeo = new THREE.TorusGeometry(0.32, 0.04, 8, 16);
      const ringMesh = new THREE.Mesh(ringGeo, accentMat);
      ringMesh.position.x = 0.5;
      ringMesh.rotation.y = Math.PI / 2;
      group.add(ringMesh);

      const wingGeo = new THREE.BoxGeometry(0.04, 1.2, 0.4);
      const wing1 = new THREE.Mesh(wingGeo, solarMat);
      wing1.position.set(0, 0, 0.5);
      const wing2 = new THREE.Mesh(wingGeo, solarMat);
      wing2.position.set(0, 0, -0.5);
      group.add(wing1);
      group.add(wing2);
    } else if (template === 'radar') {
      const boxGeo = new THREE.BoxGeometry(0.5, 0.4, 0.4);
      const boxMesh = new THREE.Mesh(boxGeo, bodyMat);
      group.add(boxMesh);

      const sarGeo = new THREE.BoxGeometry(1.4, 0.04, 0.6);
      const sarMesh = new THREE.Mesh(sarGeo, goldMat);
      sarMesh.position.set(0, -0.3, 0);
      group.add(sarMesh);

      const wingGeo = new THREE.BoxGeometry(1.2, 0.3, 0.03);
      const wing = new THREE.Mesh(wingGeo, solarMat);
      wing.position.set(0, 0.35, 0);
      group.add(wing);
    } else if (template === 'probe') {
      const busGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.45, 6);
      const busMesh = new THREE.Mesh(busGeo, bodyMat);
      group.add(busMesh);

      const dishGeo = new THREE.ConeGeometry(0.3, 0.15, 16);
      const dishMesh = new THREE.Mesh(dishGeo, goldMat);
      dishMesh.position.set(0, 0.3, 0);
      dishMesh.rotation.x = Math.PI;
      group.add(dishMesh);

      const wingGeo = new THREE.BoxGeometry(1.4, 0.03, 0.35);
      const wing = new THREE.Mesh(wingGeo, solarMat);
      wing.position.set(0, 0, 0);
      group.add(wing);
    } else {
      const boxGeo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
      const boxMesh = new THREE.Mesh(boxGeo, bodyMat);
      group.add(boxMesh);

      const wingGeo = new THREE.BoxGeometry(1.6, 0.03, 0.35);
      const wing = new THREE.Mesh(wingGeo, solarMat);
      group.add(wing);

      const dishGeo = new THREE.SphereGeometry(0.18, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2);
      const dishMesh = new THREE.Mesh(dishGeo, accentMat);
      dishMesh.position.set(0, 0.25, 0);
      dishMesh.rotation.x = Math.PI / 2;
      group.add(dishMesh);
    }

    return group;
  }

  createSpacecraftLabelSprite(name, launchYear, countryAgency) {
    const canvas = document.createElement('canvas');
    canvas.width = 384;
    canvas.height = 96;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = 'rgba(8, 15, 30, 0.88)';
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.6)';
    ctx.lineWidth = 3;
    
    const r = 10;
    const x = 8, y = 8, w = 368, h = 80;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(38, 48, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = 'bold 24px "Space Grotesk", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(name.toUpperCase(), 58, 24);

    ctx.font = '500 16px "Outfit", sans-serif';
    ctx.fillStyle = '#fbbf24';
    ctx.fillText(`${launchYear} \u2022 ${countryAgency}`, 58, 54);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const spriteMat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: true
    });

    const sprite = new THREE.Sprite(spriteMat);
    const spriteScaleY = 1.3;
    const spriteScaleX = spriteScaleY * (384 / 96);
    sprite.scale.set(spriteScaleX, spriteScaleY, 1);
    sprite.position.set(0, 1.2, 0);

    return sprite;
  }

  createSpacecraft(config, parentContainer) {
    const pivot = new THREE.Group();
    pivot.name = `${config.id}-pivot`;

    const satContainer = new THREE.Group();
    satContainer.position.set(config.orbitalDistance, 0, 0);

    const modelMesh = this.createSpacecraftModel(config.visualTemplate, config.color);
    modelMesh.name = config.id;
    modelMesh.scale.setScalar(1.0);

    modelMesh.userData = {
      id: config.id,
      name: config.name,
      parentBodyId: config.parentBodyId,
      radius: 0.8,
      type: 'artificial',
      ...config
    };

    satContainer.add(modelMesh);

    // Label Sprite
    const labelSprite = this.createSpacecraftLabelSprite(config.name, config.launchYear, config.countryAgency);
    labelSprite.visible = false; // Hidden until planet clicked
    satContainer.add(labelSprite);

    pivot.add(satContainer);
    parentContainer.add(pivot);

    // Orbit Line
    const orbitLine = this.createOrbitLine(config.orbitalDistance, config.color);
    orbitLine.visible = false; // Hidden until planet clicked
    parentContainer.add(orbitLine);

    return {
      config,
      pivot,
      satContainer,
      modelMesh,
      labelSprite,
      orbitLine,
      orbitAngle: Math.random() * Math.PI * 2
    };
  }

  createOrbitLine(radius, colorHex = 0xfbbf24) {
    const points = [];
    const segments = 128;
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(theta) * radius, 0, Math.sin(theta) * radius));
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineDashedMaterial({
      color: colorHex,
      transparent: true,
      opacity: 0.35,
      dashSize: 0.8,
      gapSize: 0.5
    });

    const line = new THREE.LineLoop(geometry, material);
    line.computeLineDistances();
    return line;
  }

  setActiveParentId(parentId) {
    this.activeParentId = parentId;
    this.spacecraftList.forEach(s => {
      const isParentActive = parentId && (s.config.parentBodyId === parentId);
      const isLayerVisible = this.layerVisibility[s.config.layer] !== false;
      
      s.labelSprite.visible = isParentActive && isLayerVisible && this.labelsVisible;
      s.orbitLine.visible = isParentActive && isLayerVisible && this.orbitsVisible;
    });
  }

  setLayerVisible(layerName, visible) {
    this.layerVisibility[layerName] = visible;
    this.setActiveParentId(this.activeParentId);
  }

  setOrbitPathsVisible(visible) {
    this.orbitsVisible = visible;
    this.setActiveParentId(this.activeParentId);
  }

  setLabelsVisible(visible) {
    this.labelsVisible = visible;
    this.setActiveParentId(this.activeParentId);
  }

  update(delta, timeSpeed = 1.0) {
    const timeFactor = delta * 60 * timeSpeed;

    this.spacecraftList.forEach(s => {
      const isLayerVisible = this.layerVisibility[s.config.layer] !== false;
      if (!isLayerVisible) return;

      s.orbitAngle += s.config.orbitSpeed * 0.012 * timeFactor;
      s.satContainer.position.x = Math.cos(s.orbitAngle) * s.config.orbitalDistance;
      s.satContainer.position.z = Math.sin(s.orbitAngle) * s.config.orbitalDistance;

      s.modelMesh.rotation.y += s.config.rotationSpeed * timeFactor;
    });
  }
}
