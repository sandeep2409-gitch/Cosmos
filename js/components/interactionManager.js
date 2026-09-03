import * as THREE from 'three';

/**
 * Raycasting & Selection Manager for Planets, Sun, Moons & Spacecraft
 * Features Crisp Thin Targeting Bracket Rings & Proportional Scaling.
 */
export class InteractionManager {
  constructor(scene, camera, domElement) {
    this.scene = scene;
    this.camera = camera;
    this.domElement = domElement;

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.interactiveTargets = []; // [{ mesh, data }]
    this.hoveredMesh = null;
    this.selectedMesh = null;
    this.selectedData = null;

    this.onSelectCallback = null;
    this.onDeselectCallback = null;

    this.init();
    this.initVisualHighlights();
  }

  initVisualHighlights() {
    // 1. Hover Highlight Ring (Thin Crisp Cyan Ring)
    const hoverGeo = new THREE.RingGeometry(1.02, 1.07, 64);
    const hoverMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8,
      depthTest: false
    });
    this.hoverRing = new THREE.Mesh(hoverGeo, hoverMat);
    this.hoverRing.visible = false;
    this.scene.add(this.hoverRing);

    // 2. Selection Ring (Thin Crisp Gold/Cyan Double Ring)
    const selectGeo = new THREE.RingGeometry(1.03, 1.09, 64);
    const selectMat = new THREE.MeshBasicMaterial({
      color: 0xfbbf24,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
      depthTest: false
    });
    this.selectRing = new THREE.Mesh(selectGeo, selectMat);
    this.selectRing.visible = false;
    this.scene.add(this.selectRing);
  }

  registerTarget(mesh, data) {
    if (!mesh) return;
    mesh.userData = { ...mesh.userData, ...data };
    this.interactiveTargets.push({ mesh, data });
  }

  init() {
    this.domElement.addEventListener('mousemove', (e) => this.onMouseMove(e));
    this.domElement.addEventListener('click', (e) => this.onClick(e));
  }

  onMouseMove(event) {
    const rect = this.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const meshes = this.interactiveTargets.map(t => t.mesh);
    const intersects = this.raycaster.intersectObjects(meshes, false);

    if (intersects.length > 0) {
      const hitMesh = intersects[0].object;
      if (this.hoveredMesh !== hitMesh) {
        this.hoveredMesh = hitMesh;
        this.domElement.style.cursor = 'pointer';
        this.updateHoverRing(this.hoveredMesh);
      }
    } else {
      if (this.hoveredMesh) {
        this.hoveredMesh = null;
        this.domElement.style.cursor = 'default';
        this.hoverRing.visible = false;
      }
    }
  }

  onClick(event) {
    const rect = this.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const meshes = this.interactiveTargets.map(t => t.mesh);
    const intersects = this.raycaster.intersectObjects(meshes, false);

    if (intersects.length > 0) {
      const hitMesh = intersects[0].object;
      const targetObj = this.interactiveTargets.find(t => t.mesh === hitMesh);
      if (targetObj) {
        this.selectObject(targetObj.mesh, targetObj.data);
      }
    } else {
      this.deselect();
    }
  }

  selectObjectById(id) {
    const targetObj = this.interactiveTargets.find(t => t.data.id === id);
    if (targetObj) {
      this.selectObject(targetObj.mesh, targetObj.data);
    }
  }

  selectObject(mesh, data) {
    this.selectedMesh = mesh;
    this.selectedData = data;

    this.updateSelectRing(mesh);

    if (this.onSelectCallback) {
      this.onSelectCallback(data, mesh);
    }
  }

  deselect() {
    this.selectedMesh = null;
    this.selectedData = null;
    this.selectRing.visible = false;

    if (this.onDeselectCallback) {
      this.onDeselectCallback();
    }
  }

  updateHoverRing(mesh) {
    if (!mesh) return;
    const worldPos = new THREE.Vector3();
    mesh.getWorldPosition(worldPos);

    const radius = mesh.userData.radius || 2.0;
    // Tight fit: 1.08x radius for planets, 1.15x for small spacecraft
    const scaleFactor = radius > 1.5 ? radius * 1.08 : radius * 1.15;
    this.hoverRing.scale.setScalar(scaleFactor);
    this.hoverRing.position.copy(worldPos);
    this.hoverRing.lookAt(this.camera.position);
    this.hoverRing.visible = true;
  }

  updateSelectRing(mesh) {
    if (!mesh) return;
    const worldPos = new THREE.Vector3();
    mesh.getWorldPosition(worldPos);

    const radius = mesh.userData.radius || 2.0;
    const scaleFactor = radius > 1.5 ? radius * 1.12 : radius * 1.2;
    this.selectRing.scale.setScalar(scaleFactor);
    this.selectRing.position.copy(worldPos);
    this.selectRing.lookAt(this.camera.position);
    this.selectRing.visible = true;
  }

  update(delta) {
    // Keep hover ring facing camera & locked to object
    if (this.hoverRing.visible && this.hoveredMesh) {
      const worldPos = new THREE.Vector3();
      this.hoveredMesh.getWorldPosition(worldPos);
      this.hoverRing.position.copy(worldPos);
      this.hoverRing.lookAt(this.camera.position);
    }

    // Keep select ring facing camera & locked to object with subtle micro pulse
    if (this.selectRing.visible && this.selectedMesh) {
      const worldPos = new THREE.Vector3();
      this.selectedMesh.getWorldPosition(worldPos);
      this.selectRing.position.copy(worldPos);
      this.selectRing.lookAt(this.camera.position);

      const pulse = 1.0 + Math.sin(Date.now() * 0.004) * 0.02;
      const radius = this.selectedMesh.userData.radius || 2.0;
      const baseScale = radius > 1.5 ? radius * 1.12 : radius * 1.2;
      this.selectRing.scale.setScalar(baseScale * pulse);
    }
  }
}
