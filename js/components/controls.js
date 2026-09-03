import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/**
 * Camera Controls Manager featuring Orbit Controls + WASD Navigation & Global Shortcuts
 */
export class ControlsManager {
  constructor(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement;

    this.controls = new OrbitControls(camera, domElement);
    
    // Callbacks for global key shortcuts
    this.onResetShortcut = null;
    this.onEscapeShortcut = null;
    this.onSpaceShortcut = null;

    // Keyboard State Tracker
    this.keys = {
      w: false,
      a: false,
      s: false,
      d: false,
      q: false,
      e: false,
      space: false,
      shift: false
    };

    this.baseMoveSpeed = 120;
    this.init();
    this.initKeyboard();
  }

  init() {
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 20000;
    this.controls.maxPolarAngle = Math.PI / 2 + 0.15;
    this.controls.target.set(0, 0, 0);
    this.controls.update();
  }

  initKeyboard() {
    window.addEventListener('keydown', (e) => this.onKeyChange(e, true));
    window.addEventListener('keyup', (e) => this.onKeyChange(e, false));
  }

  onKeyChange(event, isPressed) {
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') return;

    if (isPressed) {
      if (event.code === 'KeyR') {
        if (this.onResetShortcut) this.onResetShortcut();
        return;
      }
      if (event.code === 'Escape') {
        if (this.onEscapeShortcut) this.onEscapeShortcut();
        return;
      }
    }

    switch (event.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.keys.w = isPressed;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.keys.s = isPressed;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.keys.a = isPressed;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.keys.d = isPressed;
        break;
      case 'KeyE':
        this.keys.e = isPressed;
        break;
      case 'Space':
        this.keys.space = isPressed;
        if (isPressed && this.onSpaceShortcut) this.onSpaceShortcut();
        break;
      case 'KeyQ':
      case 'ShiftLeft':
      case 'ShiftRight':
        this.keys.q = isPressed;
        this.keys.shift = isPressed;
        break;
    }
  }

  update(delta = 0.016) {
    const distFromOrigin = this.camera.position.length();
    const dynamicSpeed = Math.max(this.baseMoveSpeed, distFromOrigin * 0.8);

    if (this.keys.w || this.keys.s || this.keys.a || this.keys.d || this.keys.q || this.keys.e || this.keys.space || this.keys.shift) {
      const moveDistance = dynamicSpeed * delta;

      const forward = new THREE.Vector3();
      const right = new THREE.Vector3();
      const up = new THREE.Vector3(0, 1, 0);

      this.camera.getWorldDirection(forward);
      forward.y = 0;
      forward.normalize();

      right.crossVectors(forward, up).normalize();

      const moveDelta = new THREE.Vector3();

      if (this.keys.w) moveDelta.addScaledVector(forward, moveDistance);
      if (this.keys.s) moveDelta.addScaledVector(forward, -moveDistance);
      if (this.keys.d) moveDelta.addScaledVector(right, moveDistance);
      if (this.keys.a) moveDelta.addScaledVector(right, -moveDistance);
      if (this.keys.e || this.keys.space) moveDelta.y += moveDistance;
      if (this.keys.q || this.keys.shift) moveDelta.y -= moveDistance;

      this.camera.position.add(moveDelta);
      this.controls.target.add(moveDelta);
    }

    this.controls.update();
  }
}
