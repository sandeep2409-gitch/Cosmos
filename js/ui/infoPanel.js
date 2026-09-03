/**
 * Redesigned Modular Tabbed Information Panel for Segment 3 (Future-Proof Architecture)
 */
export class InfoPanel {
  constructor() {
    this.container = null;
    this.currentData = null;
    this.activeTab = 'overview';

    this.onCloseCallback = null;
    this.onFocusCallback = null;
    this.onResetCallback = null;

    this.init();
  }

  init() {
    this.container = document.createElement('div');
    this.container.className = 'info-panel-container hidden';
    document.body.appendChild(this.container);
  }

  show(data) {
    if (!data) return;
    this.currentData = data;
    this.activeTab = 'overview';
    this.render();

    this.container.classList.remove('hidden');
    this.container.classList.add('visible');
  }

  hide() {
    this.container.classList.remove('visible');
    this.container.classList.add('hidden');
  }

  render() {
    if (!this.currentData) return;

    const data = this.currentData;

    this.container.innerHTML = `
      <div class="panel-header">
        <div class="panel-title-group">
          <h2 class="panel-planet-title">${data.name}</h2>
          <span class="panel-planet-subtitle">${data.positionFromSun || data.type || ''}</span>
        </div>
        <button class="panel-close-btn" id="panel-close-btn" title="Close Panel">&times;</button>
      </div>

      <div class="panel-tabs-header">
        <button class="tab-btn ${this.activeTab === 'overview' ? 'active' : ''}" data-tab="overview">Overview</button>
        <button class="tab-btn ${this.activeTab === 'science' ? 'active' : ''}" data-tab="science">Scientific Data</button>
        <button class="tab-btn ${this.activeTab === 'satellites' ? 'active' : ''}" data-tab="satellites">Satellites</button>
        <button class="tab-btn ${this.activeTab === 'ai' ? 'active' : ''}" data-tab="ai">AI Insights</button>
      </div>

      <div class="panel-tab-body">
        ${this.renderTabContent(data)}
      </div>

      <div class="panel-actions-footer">
        <button class="btn-action btn-focus" id="panel-btn-focus">🎯 Focus Target</button>
        <button class="btn-action btn-reset" id="panel-btn-reset">🌌 Reset View</button>
      </div>
    `;

    // Tab Buttons
    this.container.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-tab');
        this.activeTab = tab;
        this.render();
      });
    });

    // Close Button
    document.getElementById('panel-close-btn').addEventListener('click', () => {
      this.hide();
      if (this.onCloseCallback) this.onCloseCallback();
    });

    // Focus & Reset Buttons
    document.getElementById('panel-btn-focus').addEventListener('click', () => {
      if (this.onFocusCallback) this.onFocusCallback();
    });

    document.getElementById('panel-btn-reset').addEventListener('click', () => {
      this.hide();
      if (this.onResetCallback) this.onResetCallback();
    });
  }

  renderTabContent(data) {
    if (this.activeTab === 'overview') {
      return `
        <p class="panel-description">${data.description || 'No overview available.'}</p>

        <div class="panel-section-title">QUICK FACTS</div>
        <div class="panel-stats-grid">
          <div class="stat-card">
            <span class="stat-label">Diameter</span>
            <span class="stat-value">${data.diameter || 'N/A'}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Day Length</span>
            <span class="stat-value">${data.rotationPeriod || 'N/A'}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Year Length</span>
            <span class="stat-value">${data.orbitalPeriod || 'N/A'}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Moons</span>
            <span class="stat-value">${data.moonsCount || 'N/A'}</span>
          </div>
        </div>
      `;
    }

    if (this.activeTab === 'science') {
      return `
        <div class="panel-section-title">PHYSICAL & ATMOSPHERIC PARAMETERS</div>
        <div class="science-table">
          <div class="science-row">
            <span class="sc-label">Mass</span>
            <span class="sc-val">${data.mass || 'N/A'}</span>
          </div>
          <div class="science-row">
            <span class="sc-label">Surface Temp</span>
            <span class="sc-val">${data.surfaceTemp || 'N/A'}</span>
          </div>
          <div class="science-row">
            <span class="sc-label">Atmosphere</span>
            <span class="sc-val">${data.atmosphere || 'N/A'}</span>
          </div>
          <div class="science-row">
            <span class="sc-label">Surface Gravity</span>
            <span class="sc-val">${data.gravity || 'N/A'}</span>
          </div>
        </div>
      `;
    }

    if (this.activeTab === 'satellites') {
      return `
        <div class="panel-placeholder">
          <span class="ph-icon">🛰️</span>
          <span class="ph-title">Satellite & Moon System</span>
          <span class="ph-text">Detailed moon orbits and exploration telemetry will be unlocked in upcoming system segments.</span>
        </div>
      `;
    }

    if (this.activeTab === 'ai') {
      return `
        <div class="panel-placeholder">
          <span class="ph-icon">🤖</span>
          <span class="ph-title">Cosmic AI Insights</span>
          <span class="ph-text">Real-time planetary analysis and generative astrophysics synthesis arriving in future updates.</span>
        </div>
      `;
    }

    return '';
  }
}
