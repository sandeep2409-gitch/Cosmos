import * as THREE from 'three';

/**
 * Interaction Manager handling Raycasting, Cursor states, Dual Highlighting & Selection
 */
export class InteractionManager {
  constructor(scene, camera, domElement) {
    this.scene = scene;
    this.camera = camera;
    this.domElement = domElement;

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2(-1000, -1000);

    this.interactiveTargets = [];
    this.hoveredMesh = null;
    this.selectedMesh = null;
    this.selectedData = null;

    // Callbacks
    this.onSelectCallback = null;
    this.onDeselectCallback = null;

    this.initHighlights();
    this.initEvents();
  }

  /**
   * Register interactive meshes (Sun & Planets)
   */
  registerTarget(mesh, objectData) {
    mesh.userData = { ...mesh.userData, ...objectData };
    this.interactiveTargets.push(mesh);
  }

  /**
   * Initialize Hover and Selected 3D Highlight Ring Meshes
   */
  initHighlights() {
    // 1. Hover Highlight Ring (Subtle Translucent Ring)
    const hoverGeo = new THREE.RingGeometry(1, 1.15, 64);
    const hoverMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending
    });
    this.hoverHighlight = new THREE.Mesh(hoverGeo, hoverMat);
    this.hoverHighlight.visible = false;
    this.scene.add(this.hoverHighlight);

    // 2. Selection Highlight Halo (Pulsating Cyan/Gold Ring)
    const selectGeo = new THREE.RingGeometry(1, 1.25, 64);
    const selectMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });
    this.selectHighlight = new THREE.Mesh(selectGeo, selectMat);
    this.selectHighlight.visible = false;
    this.scene.add(this.selectHighlight);
  }

  initEvents() {
    this.domElement.addEventListener('pointermove', (e) => this.onPointerMove(e));
    this.domElement.addEventListener('pointerdown', (e) => this.onPointerDown(e));
  }

  updateMouseCoords(event) {
    const rect = this.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  onPointerMove(event) {
    this.updateMouseCoords(event);

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.interactiveTargets, false);

    if (intersects.length > 0) {
      const hitMesh = intersects[0].object;
      if (this.hoveredMesh !== hitMesh) {
        this.hoveredMesh = hitMesh;
        this.domElement.style.cursor = 'pointer';
      }
    } else {
      if (this.hoveredMesh) {
        this.hoveredMesh = null;
        this.domElement.style.cursor = 'default';
        this.hoverHighlight.visible = false;
      }
    }
  }

  onPointerDown(event) {
    // Only respond to primary left click / touch tap
    if (event.button !== undefined && event.button !== 0) return;

    this.updateMouseCoords(event);
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.interactiveTargets, false);

    if (intersects.length > 0) {
      const hitMesh = intersects[0].object;
      this.selectObject(hitMesh);
    } else {
      this.deselect();
    }
  }

  selectObject(mesh) {
    this.selectedMesh = mesh;
    this.selectedData = mesh.userData;

    // Emphasize Planet Labels
    this.updateLabelEmphasis(mesh.userData.id);

    if (this.onSelectCallback) {
      this.onSelectCallback(this.selectedData, this.selectedMesh);
    }
  }

  selectObjectById(id) {
    const target = this.interactiveTargets.find(m => m.userData.id === id);
    if (target) {
      this.selectObject(target);
    }
  }

  deselect() {
    this.selectedMesh = null;
    this.selectedData = null;
    this.selectHighlight.visible = false;
    this.updateLabelEmphasis(null);

    if (this.onDeselectCallback) {
      this.onDeselectCallback();
    }
  }

  updateLabelEmphasis(activeId) {
    const labels = document.querySelectorAll('.planet-label-container');
    labels.forEach(label => {
      const text = label.querySelector('.planet-label-text');
      if (text && activeId && text.textContent.toLowerCase() === activeId.toLowerCase()) {
        label.classList.add('active');
      } else {
        label.classList.remove('active');
      }
    });
  }

  update(delta) {
    // 1. Update Hover Highlight position
    if (this.hoveredMesh && this.hoveredMesh !== this.selectedMesh) {
      const worldPos = new THREE.Vector3();
      this.hoveredMesh.getWorldPosition(worldPos);

      const radius = this.hoveredMesh.userData.radius || 2.5;
      const scale = radius * 1.15;
      this.hoverHighlight.scale.set(scale, scale, scale);
      this.hoverHighlight.position.copy(worldPos);
      this.hoverHighlight.lookAt(this.camera.position); // Billboard to face camera
      this.hoverHighlight.visible = true;
    } else {
      this.hoverHighlight.visible = false;
    }

    // 2. Update Selected Highlight position & Pulsating Halo Animation
    if (this.selectedMesh) {
      const worldPos = new THREE.Vector3();
      this.selectedMesh.getWorldPosition(worldPos);

      const radius = this.selectedMesh.userData.radius || 2.5;
      const pulse = 1.0 + Math.sin(Date.now() * 0.005) * 0.05;
      const scale = radius * 1.25 * pulse;

      this.selectHighlight.scale.set(scale, scale, scale);
      this.selectHighlight.position.copy(worldPos);
      this.selectHighlight.lookAt(this.camera.position);
      this.selectHighlight.visible = true;
    } else {
      this.selectHighlight.visible = false;
    }
  }
}
