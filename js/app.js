import * as THREE from 'three';
import { SceneManager } from './components/sceneManager.js';
import { Starfield } from './components/starfield.js';
import { Sun } from './components/sun.js';
import { PlanetFactory } from './components/planetFactory.js';
import { ControlsManager } from './components/controls.js';
import { InteractionManager } from './components/interactionManager.js';
import { CameraAnimator } from './components/cameraAnimator.js';
import { UIOverlay } from './ui/overlay.js';
import { InfoCard } from './ui/infoCard.js';

/**
 * Main Application Core with Segment 2 Interaction System & Real AU Scale Support
 */
class Application {
  constructor() {
    this.container = document.getElementById('canvas-container');
    this.clock = new THREE.Clock();
    
    this.init();
  }

  init() {
    // 1. Scene, Camera & WebGL / CSS2D Renderers
    this.sceneManager = new SceneManager(this.container);

    // 2. Starfield & Central Sun
    this.starfield = new Starfield(this.sceneManager.scene, 3500);
    this.sun = new Sun(this.sceneManager.scene);

    // 3. Planets & Orbital Paths
    this.planetFactory = new PlanetFactory(this.sceneManager.scene);

    // 4. Camera Controls & Camera Animator
    this.controlsManager = new ControlsManager(
      this.sceneManager.camera,
      this.sceneManager.renderer.domElement
    );
    this.cameraAnimator = new CameraAnimator(
      this.sceneManager.camera,
      this.controlsManager
    );

    // 5. Interaction Manager & Raycasting Setup
    this.interactionManager = new InteractionManager(
      this.sceneManager.scene,
      this.sceneManager.camera,
      this.sceneManager.renderer.domElement
    );

    // Register Sun as interactive target
    this.interactionManager.registerTarget(this.sun.mesh, this.sun.config);

    // Register 8 Planets as interactive targets
    this.planetFactory.planets.forEach(p => {
      this.interactionManager.registerTarget(p.planetMesh, p.config);
    });

    // 6. UI Overlay & Information Card Components
    this.uiOverlay = new UIOverlay();
    this.infoCard = new InfoCard();

    // 7. Connect Callbacks
    this.setupCallbacks();

    // 8. Start Main Loop
    this.animate();
  }

  setupCallbacks() {
    // Scale Mode Toggle (Visual vs Real AU Scale)
    this.uiOverlay.onScaleToggleCallback = (mode) => {
      this.planetFactory.setScaleMode(mode);
      this.sun.setScaleMode(mode);
      this.uiOverlay.updateDisclaimer(mode);
    };

    // On Celestial Object Selected
    this.interactionManager.onSelectCallback = (data, mesh) => {
      this.infoCard.show(data);
      this.uiOverlay.setFocusButtonVisible(true);
      const radius = mesh.userData.radius || data.radius || 3.0;
      this.cameraAnimator.focusOnObject(mesh, radius);
    };

    // On Object Deselected / Clicked Empty Space
    this.interactionManager.onDeselectCallback = () => {
      this.infoCard.hide();
      this.uiOverlay.setFocusButtonVisible(false);
    };

    // InfoCard Close Button Clicked
    this.infoCard.onCloseCallback = () => {
      this.interactionManager.deselect();
    };

    // Focus Target Button Clicked
    const handleFocus = () => {
      if (this.interactionManager.selectedMesh) {
        const mesh = this.interactionManager.selectedMesh;
        const radius = mesh.userData.radius || 3.0;
        this.cameraAnimator.focusOnObject(mesh, radius);
      }
    };
    this.infoCard.onFocusCallback = handleFocus;
    this.uiOverlay.onFocusCallback = handleFocus;

    // Reset View Button Clicked
    const handleReset = () => {
      this.interactionManager.deselect();
      this.cameraAnimator.resetToOverview();
    };
    this.infoCard.onResetCallback = handleReset;
    this.uiOverlay.onResetCallback = handleReset;
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const delta = this.clock.getDelta();

    // Update Sun Shaders & Scale Lerp
    this.sun.update(delta);

    // Update Planet Orbital Motion & Scale Lerp
    this.planetFactory.update(delta);

    // Update Hover & Selection Ring Animations
    this.interactionManager.update(delta);

    // Update Camera Lerp Transitions & Orbital Focus Tracking
    this.cameraAnimator.update(delta);

    // Update Camera Flight Controls Damping
    this.controlsManager.update(delta);

    // Render 3D & CSS2D Scenes
    this.sceneManager.render();
  }
}

// Launch App on Load
window.addEventListener('DOMContentLoaded', () => {
  new Application();
});
