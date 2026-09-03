import * as THREE from 'three';

/**
 * Camera Animator for Smooth Lerp Transitions & Dynamic Orbit Target Tracking
 */
export class CameraAnimator {
  constructor(camera, controlsManager) {
    this.camera = camera;
    this.controlsManager = controlsManager;
    this.controls = controlsManager.controls;

    this.targetMesh = null;
    this.targetRadius = 10;
    this.isFocusing = false;
    this.isResetting = false;

    // Overview default settings
    this.defaultCameraPos = new THREE.Vector3(0, 110, 230);
    this.defaultTargetPos = new THREE.Vector3(0, 0, 0);

    // Current interpolation goals
    this.goalCameraPos = new THREE.Vector3();
    this.goalTargetPos = new THREE.Vector3();

    this.lerpSpeed = 4.5; // Smooth exponential interpolation speed
  }

  /**
   * Focus camera smoothly on a celestial object mesh
   */
  focusOnObject(mesh, radius) {
    this.targetMesh = mesh;
    this.targetRadius = radius;
    this.isFocusing = true;
    this.isResetting = false;
  }

  /**
   * Reset camera smoothly back to default Solar System overview position
   */
  resetToOverview() {
    this.targetMesh = null;
    this.isFocusing = false;
    this.isResetting = true;

    this.goalCameraPos.copy(this.defaultCameraPos);
    this.goalTargetPos.copy(this.defaultTargetPos);
  }

  /**
   * Main per-frame update loop
   */
  update(delta) {
    if (!this.isFocusing && !this.isResetting) return;

    const lerpFactor = Math.min(1.0, (1 - Math.exp(-this.lerpSpeed * delta)));

    if (this.isFocusing && this.targetMesh) {
      // Get current world position of target planet mesh
      const worldPos = new THREE.Vector3();
      this.targetMesh.getWorldPosition(worldPos);

      this.goalTargetPos.copy(worldPos);

      // Optimal viewing offset based on radius
      const offsetDist = Math.max(22, this.targetRadius * 3.4 + 10);
      
      // Calculate offset vector from target in camera's direction
      const currentDir = new THREE.Vector3().subVectors(this.camera.position, this.controls.target);
      if (currentDir.lengthSq() < 0.1) currentDir.set(0, 1, 2);
      currentDir.normalize().multiplyScalar(offsetDist);

      this.goalCameraPos.copy(worldPos).add(currentDir);
    }

    // Lerp Camera Position & Controls Target
    this.camera.position.lerp(this.goalCameraPos, lerpFactor);
    this.controls.target.lerp(this.goalTargetPos, lerpFactor);
    this.controls.update();

    // Check if lerp transition has arrived close enough to goal
    if (this.isResetting) {
      if (this.camera.position.distanceTo(this.goalCameraPos) < 0.5) {
        this.isResetting = false;
      }
    }
  }
}
