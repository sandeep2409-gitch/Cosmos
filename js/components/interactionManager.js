import * as THREE from 'three';

/**
 * Raycasting & Selection Manager for Planets, Sun, Moons & Spacecraft
 * Handles object selection and camera focus triggering (Highlighting rings removed).
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
      }
    } else {
      if (this.hoveredMesh) {
        this.hoveredMesh = null;
        this.domElement.style.cursor = 'default';
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

    if (this.onSelectCallback) {
      this.onSelectCallback(data, mesh);
    }
  }

  deselect() {
    this.selectedMesh = null;
    this.selectedData = null;

    if (this.onDeselectCallback) {
      this.onDeselectCallback();
    }
  }

  update(delta) {
    // Highlighting rings completely removed
  }
}
