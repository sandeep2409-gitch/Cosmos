/**
 * Simulation Control Burger Menu Component
 * Manages Time Speed / Pause, Display Toggles, and Satellite Layers inside a Burger Menu.
 */
export class SimControls {
  constructor(onTimeSpeedChange, onToggleOrbits, onToggleLabels, onToggleLayer) {
    this.onTimeSpeedChange = onTimeSpeedChange;
    this.onToggleOrbits = onToggleOrbits;
    this.onToggleLabels = onToggleLabels;
    this.onToggleLayer = onToggleLayer;

    this.speed = 1.0;
    this.orbitsVisible = true;
    this.labelsVisible = true;

    this.init();
  }

  init() {
    const burgerBtn = document.getElementById('sim-burger-btn');
    const menuPanel = document.getElementById('sim-controls-menu');
    const closeBtn = document.getElementById('sim-menu-close');

    // 1. Toggle Burger Menu Open / Closed
    if (burgerBtn && menuPanel) {
      burgerBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        menuPanel.classList.toggle('hidden');
        burgerBtn.classList.toggle('active');
      });

      if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          menuPanel.classList.add('hidden');
          burgerBtn.classList.remove('active');
        });
      }

      // Close menu when clicking outside
      document.addEventListener('click', (e) => {
        if (!menuPanel.contains(e.target) && !burgerBtn.contains(e.target)) {
          menuPanel.classList.add('hidden');
          burgerBtn.classList.remove('active');
        }
      });
    }

    // 2. Time Speed & Pause Buttons
    const speedButtons = document.querySelectorAll('.speed-btn');
    speedButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const speedVal = parseFloat(btn.getAttribute('data-speed'));
        this.setSpeed(speedVal);
      });
    });

    // 3. Display Toggles (Orbit Paths)
    const toggleOrbits = document.getElementById('toggle-orbit-paths');
    if (toggleOrbits) {
      toggleOrbits.addEventListener('change', (e) => {
        this.orbitsVisible = e.target.checked;
        if (this.onToggleOrbits) this.onToggleOrbits(this.orbitsVisible);
      });
    }

    // Display Toggles (Labels)
    const toggleLabels = document.getElementById('toggle-planet-labels');
    if (toggleLabels) {
      toggleLabels.addEventListener('change', (e) => {
        this.labelsVisible = e.target.checked;
        if (this.onToggleLabels) this.onToggleLabels(this.labelsVisible);
      });
    }

    // 4. Remaining Layer Checkboxes
    const layerCheckboxes = document.querySelectorAll('.layer-checkbox');
    layerCheckboxes.forEach(cb => {
      cb.addEventListener('change', (e) => {
        const layerName = cb.getAttribute('data-layer');
        if (this.onToggleLayer) this.onToggleLayer(layerName, e.target.checked);
      });
    });
  }

  /**
   * Set simulation speed and update active button & burger badge state
   */
  setSpeed(speedVal) {
    this.speed = speedVal;
    const speedBadge = document.getElementById('sim-speed-badge');
    const speedButtons = document.querySelectorAll('.speed-btn');

    speedButtons.forEach(btn => {
      if (parseFloat(btn.getAttribute('data-speed')) === speedVal) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    if (speedBadge) {
      speedBadge.textContent = speedVal === 0 ? 'PAUSED' : `${speedVal}×`;
      if (speedVal === 0) {
        speedBadge.classList.add('paused');
      } else {
        speedBadge.classList.remove('paused');
      }
    }

    if (this.onTimeSpeedChange) this.onTimeSpeedChange(this.speed);
  }
}
