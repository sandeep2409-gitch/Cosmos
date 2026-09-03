import * as THREE from 'three';
import { SceneManager } from './components/sceneManager.js';
import { Starfield } from './components/starfield.js';
import { Sun } from './components/sun.js';
import { PlanetFactory } from './components/planetFactory.js';
import { ControlsManager } from './components/controls.js';
import { InteractionManager } from './components/interactionManager.js';
import { CameraAnimator } from './components/cameraAnimator.js';
import { UIOverlay } from './ui/overlay.js';
import { LoadingScreen } from './ui/loadingScreen.js';
import { HeroIntro } from './ui/heroIntro.js';
import { TopNav } from './ui/topNav.js';
import { SimControls } from './ui/simControls.js';
import { HelpModal } from './ui/helpModal.js';
import { InfoPanel } from './ui/infoPanel.js';

/**
 * Main Application Core — Segment 4 Satellite & Moon System
 */
class Application {
  constructor() {
    this.container = document.getElementById('canvas-container');
    this.clock = new THREE.Clock();
    this.timeMultiplier = 1.0;
    
    this.init();
  }

  init() {
    // 1. Scene, Camera & WebGL Renderers
    this.sceneManager = new SceneManager(this.container);

    // 2. Starfield & Central Sun
    this.starfield = new Starfield(this.sceneManager.scene, 3500);
    this.sun = new Sun(this.sceneManager.scene);

    // 3. Planets, Orbit Paths & Satellite Moons
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

    // 5. Interaction Manager & Unified Raycasting Setup
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

    // Register 16 Satellite Moons as interactive targets
    this.planetFactory.satelliteFactory.satellites.forEach(s => {
      this.interactionManager.registerTarget(s.moonMesh, s.config);
    });

    // 6. UI Modules
    this.uiOverlay = new UIOverlay();
    this.infoPanel = new InfoPanel();
    this.helpModal = new HelpModal();

    this.simControls = new SimControls(
      (speed) => { this.timeMultiplier = speed; },
      (orbitsVisible) => { this.planetFactory.setOrbitPathsVisible(orbitsVisible); },
      (labelsVisible) => { this.planetFactory.setPlanetLabelsVisible(labelsVisible); }
    );

    this.topNav = new TopNav(
      (id) => {
        if (id) {
          this.interactionManager.selectObjectById(id);
        } else {
          this.interactionManager.deselect();
          this.cameraAnimator.resetToOverview();
        }
      },
      () => { this.helpModal.toggle(); }
    );

    this.heroIntro = new HeroIntro(() => {
      // Intro completed / skipped
    });

    this.loadingScreen = new LoadingScreen(() => {
      // Reveal Hero Intro when loading completes
      this.heroIntro.show();
    });

    // 7. Connect Callbacks & Hierarchical Navigation
    this.setupCallbacks();

    // 8. Start Main Animation Loop
    this.animate();
  }

  setupCallbacks() {
    // Scale Mode Toggle (Visual vs Real AU Scale)
    this.uiOverlay.onScaleToggleCallback = (mode) => {
      this.planetFactory.setScaleMode(mode);
      this.sun.setScaleMode(mode);
      this.uiOverlay.updateDisclaimer(mode);
      this.cameraAnimator.setOverviewForScaleMode(mode);
      this.cameraAnimator.resetToOverview();
    };

    // On Celestial Object Selected (Planet or Moon)
    this.interactionManager.onSelectCallback = (data, mesh) => {
      this.infoPanel.show(data);
      this.topNav.updateBreadcrumb(data);
      this.uiOverlay.setFocusButtonVisible(true);

      const radius = mesh.userData.radius || data.radius || 3.0;
      this.cameraAnimator.focusOnObject(mesh, radius);
    };

    // On Object Deselected / Clicked Empty Space
    this.interactionManager.onDeselectCallback = () => {
      this.infoPanel.hide();
      this.topNav.updateBreadcrumb(null);
      this.uiOverlay.setFocusButtonVisible(false);
    };

    // InfoPanel Moon Badge Clicked (e.g. [ Europa ])
    this.infoPanel.onSelectMoonCallback = (moonId) => {
      this.interactionManager.selectObjectById(moonId);
    };

    // InfoPanel Back To Parent Planet Clicked (e.g. ← BACK TO JUPITER)
    this.infoPanel.onSelectParentPlanetCallback = (planetId) => {
      this.interactionManager.selectObjectById(planetId);
    };

    // InfoPanel Close Button Clicked
    this.infoPanel.onCloseCallback = () => {
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
    this.infoPanel.onFocusCallback = handleFocus;
    this.uiOverlay.onFocusCallback = handleFocus;

    // Reset View Button Clicked (UI Button or R key)
    const handleReset = () => {
      this.interactionManager.deselect();
      this.infoPanel.hide();
      this.topNav.updateBreadcrumb(null);
      this.cameraAnimator.resetToOverview();
    };
    this.infoPanel.onResetCallback = handleReset;
    this.uiOverlay.onResetCallback = handleReset;

    // Global Keyboard Shortcuts (R key reset, ESC key close)
    this.controlsManager.onResetShortcut = handleReset;
    this.controlsManager.onEscapeShortcut = () => {
      this.interactionManager.deselect();
      this.infoPanel.hide();
      this.helpModal.hide();
    };
    this.controlsManager.onSpaceShortcut = () => {
      if (this.timeMultiplier > 0) {
        this.simControls.setSpeed(0);
      } else {
        this.simControls.setSpeed(1);
      }
    };
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const delta = this.clock.getDelta();

    // Update Sun Shaders & Scale Lerp
    this.sun.update(delta);

    // Update Planet & Moon Orbital Motion with Time Speed Multiplier
    this.planetFactory.update(delta, this.timeMultiplier);

    // Update Hover & Selection Ring Animations
    this.interactionManager.update(delta);

    // Update Camera Lerp Transitions & Orbital Focus Tracking
    this.cameraAnimator.update(delta);

    // Update Camera Flight Controls Damping
    this.controlsManager.update(delta);

    // Render 3D & CSS2D Scenes via EffectComposer
    this.sceneManager.render();
  }
}

// Launch Application on DOM Load
window.addEventListener('DOMContentLoaded', () => {
  new Application();
});
