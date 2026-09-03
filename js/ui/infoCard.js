/**
 * Modern Glassmorphic Information Card Component for Segment 2
 */
export class InfoCard {
  constructor() {
    this.container = null;
    this.onCloseCallback = null;
    this.onFocusCallback = null;
    this.onResetCallback = null;

    this.init();
  }

  init() {
    this.container = document.createElement('div');
    this.container.className = 'info-card-container hidden';
    document.body.appendChild(this.container);
  }

  /**
   * Display card with object data
   */
  show(data) {
    if (!data) return;

    this.container.innerHTML = `
      <div class="info-card-header">
        <div class="info-title-group">
          <h2 class="info-planet-title">${data.name}</h2>
          <span class="info-planet-type">${data.type || 'Celestial Object'}</span>
        </div>
        <button class="info-close-btn" id="info-close-btn" title="Close Card">&times;</button>
      </div>

      <p class="info-description">${data.description || 'No description available.'}</p>

      <div class="info-stats-grid">
        <div class="stat-box">
          <span class="stat-label">Position</span>
          <span class="stat-value">${data.positionFromSun || 'N/A'}</span>
        </div>
        <div class="stat-box">
          <span class="stat-label">Diameter</span>
          <span class="stat-value">${data.diameter || 'N/A'}</span>
        </div>
        <div class="stat-box">
          <span class="stat-label">Distance</span>
          <span class="stat-value">${data.distanceFromSun || 'N/A'}</span>
        </div>
        <div class="stat-box">
          <span class="stat-label">Orbital Period</span>
          <span class="stat-value">${data.orbitalPeriod || 'N/A'}</span>
        </div>
        <div class="stat-box">
          <span class="stat-label">Rotation Period</span>
          <span class="stat-value">${data.rotationPeriod || 'N/A'}</span>
        </div>
        <div class="stat-box">
          <span class="stat-label">Moons</span>
          <span class="stat-value">${data.moonsCount || 'N/A'}</span>
        </div>
      </div>

      <div class="info-actions">
        <button class="btn-action btn-focus" id="info-btn-focus">🎯 Focus Target</button>
        <button class="btn-action btn-reset" id="info-btn-reset">🌌 Reset View</button>
      </div>
    `;

    // Attach Event Listeners
    document.getElementById('info-close-btn').addEventListener('click', () => {
      this.hide();
      if (this.onCloseCallback) this.onCloseCallback();
    });

    document.getElementById('info-btn-focus').addEventListener('click', () => {
      if (this.onFocusCallback) this.onFocusCallback();
    });

    document.getElementById('info-btn-reset').addEventListener('click', () => {
      this.hide();
      if (this.onResetCallback) this.onResetCallback();
    });

    this.container.classList.remove('hidden');
    this.container.classList.add('visible');
  }

  /**
   * Hide Information Card
   */
  hide() {
    this.container.classList.remove('visible');
    this.container.classList.add('hidden');
  }
}
