import { PLANETS_DATA } from '../config/planetsData.js';
import { SATELLITES_DATA } from '../config/satellitesData.js';

/**
 * Modular Tabbed Information Panel for Segment 4 (Planets & Satellites Integration)
 */
export class InfoPanel {
  constructor() {
    this.container = null;
    this.currentData = null;
    this.activeTab = 'overview';

    this.onCloseCallback = null;
    this.onFocusCallback = null;
    this.onResetCallback = null;
    this.onSelectMoonCallback = null;
    this.onSelectParentPlanetCallback = null;

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
    const isMoon = data.type === 'satellite' || data.type === 'Natural Satellite' || data.type === 'Galilean Satellite';
    const parentPlanet = isMoon ? PLANETS_DATA.find(p => p.id === data.parentPlanetId) : null;

    this.container.innerHTML = `
      <div class="panel-header">
        <div class="panel-title-group">
          <h2 class="panel-planet-title">${data.name}</h2>
          <span class="panel-planet-subtitle">
            ${isMoon ? `NATURAL SATELLITE OF ${parentPlanet ? parentPlanet.name.toUpperCase() : data.parentPlanetId.toUpperCase()}` : (data.positionFromSun || data.type || '')}
          </span>
        </div>
        <button class="panel-close-btn" id="panel-close-btn" title="Close Panel">&times;</button>
      </div>

      <div class="panel-tabs-header">
        <button class="tab-btn ${this.activeTab === 'overview' ? 'active' : ''}" data-tab="overview">Overview</button>
        <button class="tab-btn ${this.activeTab === 'science' ? 'active' : ''}" data-tab="science">Scientific Data</button>
        <button class="tab-btn ${this.activeTab === 'satellites' ? 'active' : ''}" data-tab="satellites">
          ${isMoon ? 'Parent Planet' : 'Moons'}
        </button>
        <button class="tab-btn ${this.activeTab === 'ai' ? 'active' : ''}" data-tab="ai">AI Insights</button>
      </div>

      <div class="panel-tab-body">
        ${this.renderTabContent(data, isMoon, parentPlanet)}
      </div>

      <div class="panel-actions-footer">
        ${isMoon ? `
          <button class="btn-action btn-parent" id="panel-btn-parent">
            &larr; BACK TO ${parentPlanet ? parentPlanet.name.toUpperCase() : 'PLANET'}
          </button>
        ` : `
          <button class="btn-action btn-focus" id="panel-btn-focus">🎯 Focus Target</button>
        `}
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

    // Action Buttons
    const focusBtn = document.getElementById('panel-btn-focus');
    if (focusBtn) {
      focusBtn.addEventListener('click', () => {
        if (this.onFocusCallback) this.onFocusCallback();
      });
    }

    const parentBtn = document.getElementById('panel-btn-parent');
    if (parentBtn && parentPlanet) {
      parentBtn.addEventListener('click', () => {
        if (this.onSelectParentPlanetCallback) this.onSelectParentPlanetCallback(parentPlanet.id);
      });
    }

    document.getElementById('panel-btn-reset').addEventListener('click', () => {
      this.hide();
      if (this.onResetCallback) this.onResetCallback();
    });

    // Moon Badges Click Listeners inside tab content
    this.container.querySelectorAll('.moon-badge').forEach(badge => {
      badge.addEventListener('click', () => {
        const moonId = badge.getAttribute('data-moon-id');
        if (this.onSelectMoonCallback) this.onSelectMoonCallback(moonId);
      });
    });
  }

  renderTabContent(data, isMoon, parentPlanet) {
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
            <span class="stat-label">${isMoon ? 'Distance to Planet' : 'Distance to Sun'}</span>
            <span class="stat-value">${data.distanceFromPlanet || data.distanceFromSun || 'N/A'}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Orbital Period</span>
            <span class="stat-value">${data.orbitalPeriod || 'N/A'}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Rotation Period</span>
            <span class="stat-value">${data.rotationPeriod || 'N/A'}</span>
          </div>
        </div>

        ${!isMoon && data.majorSatelliteIds && data.majorSatelliteIds.length > 0 ? `
          <div class="panel-section-title" style="margin-top: 12px;">MAJOR MOONS</div>
          <div class="moon-badges-container">
            ${data.majorSatelliteIds.map(mId => {
              const moon = SATELLITES_DATA.find(s => s.id === mId);
              return moon ? `<button class="moon-badge" data-moon-id="${moon.id}">🌙 ${moon.name}</button>` : '';
            }).join('')}
          </div>
        ` : ''}
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
            <span class="sc-label">${isMoon ? 'Composition' : 'Atmosphere'}</span>
            <span class="sc-val">${data.composition || data.atmosphere || 'N/A'}</span>
          </div>
          ${!isMoon ? `
            <div class="science-row">
              <span class="sc-label">Surface Gravity</span>
              <span class="sc-val">${data.gravity || 'N/A'}</span>
            </div>
          ` : ''}
        </div>
      `;
    }

    if (this.activeTab === 'satellites') {
      if (isMoon && parentPlanet) {
        return `
          <div class="parent-planet-card">
            <div class="pp-title-group">
              <span class="pp-label">PARENT PLANET</span>
              <h3 class="pp-name">${parentPlanet.name}</h3>
              <span class="pp-type">${parentPlanet.type}</span>
            </div>
            <p class="pp-desc">${parentPlanet.description}</p>
          </div>
        `;
      }

      if (!isMoon && data.majorSatelliteIds && data.majorSatelliteIds.length > 0) {
        return `
          <div class="panel-section-title">MAJOR SATELLITES (${data.majorSatelliteIds.length})</div>
          <div class="moon-list-detailed">
            ${data.majorSatelliteIds.map(mId => {
              const moon = SATELLITES_DATA.find(s => s.id === mId);
              if (!moon) return '';
              return `
                <div class="moon-card moon-badge" data-moon-id="${moon.id}">
                  <div class="mc-icon">🌙</div>
                  <div class="mc-info">
                    <span class="mc-name">${moon.name}</span>
                    <span class="mc-sub">${moon.diameter} &bull; ${moon.orbitalPeriod}</span>
                  </div>
                  <span class="mc-arrow">&rarr;</span>
                </div>
              `;
            }).join('')}
          </div>
        `;
      }

      return `
        <div class="panel-placeholder">
          <span class="ph-icon">🛰️</span>
          <span class="ph-title">No Major Moons Configured</span>
          <span class="ph-text">This planet does not have major natural satellites in the current dataset.</span>
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
