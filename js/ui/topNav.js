import { PLANETS_DATA, SUN_CONFIG } from '../config/planetsData.js';
import { SATELLITES_DATA } from '../config/satellitesData.js';

/**
 * Top Navigation Bar, Objects Drawer & Hierarchical Breadcrumb Component
 */
export class TopNav {
  constructor(onSelectObject, onOpenHelp) {
    this.onSelectObject = onSelectObject;
    this.onOpenHelp = onOpenHelp;

    this.objectsMenu = document.getElementById('nav-objects-dropdown');
    this.objectsToggleBtn = document.getElementById('nav-btn-objects');
    this.aboutModal = document.getElementById('modal-about');
    this.breadcrumbContainer = document.getElementById('nav-breadcrumb');

    this.init();
  }

  init() {
    // Populate Objects Drawer
    if (this.objectsMenu) {
      const allObjects = [SUN_CONFIG, ...PLANETS_DATA];
      this.objectsMenu.innerHTML = allObjects.map(obj => `
        <button class="drawer-item" data-id="${obj.id}">
          <span class="drawer-item-dot" style="background-color: #${(obj.color || 0x38bdf8).toString(16).padStart(6, '0')}"></span>
          <span class="drawer-item-name">${obj.name}</span>
          <span class="drawer-item-type">${obj.type || ''}</span>
        </button>
      `).join('');

      this.objectsMenu.querySelectorAll('.drawer-item').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = btn.getAttribute('data-id');
          if (this.onSelectObject) this.onSelectObject(id);
          this.closeObjectsDrawer();
        });
      });
    }

    // Toggle Objects Menu
    if (this.objectsToggleBtn) {
      this.objectsToggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleObjectsDrawer();
      });
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
      this.closeObjectsDrawer();
    });

    // About Button & Modal
    const aboutBtn = document.getElementById('nav-btn-about');
    const closeAboutBtn = document.getElementById('about-close-btn');

    if (aboutBtn && this.aboutModal) {
      aboutBtn.addEventListener('click', () => {
        this.aboutModal.classList.add('visible');
      });
    }

    if (closeAboutBtn && this.aboutModal) {
      closeAboutBtn.addEventListener('click', () => {
        this.aboutModal.classList.remove('visible');
      });
    }

    // Help Button
    const helpBtn = document.getElementById('nav-btn-help');
    if (helpBtn) {
      helpBtn.addEventListener('click', () => {
        if (this.onOpenHelp) this.onOpenHelp();
      });
    }
  }

  updateBreadcrumb(data) {
    if (!this.breadcrumbContainer) return;

    if (!data) {
      this.breadcrumbContainer.innerHTML = `
        <span class="bc-item active">SOLAR SYSTEM</span>
      `;
      return;
    }

    if (data.type === 'satellite') {
      const parentPlanet = PLANETS_DATA.find(p => p.id === data.parentPlanetId);
      const parentName = parentPlanet ? parentPlanet.name.toUpperCase() : data.parentPlanetId.toUpperCase();

      this.breadcrumbContainer.innerHTML = `
        <span class="bc-item bc-link" id="bc-solar">SOLAR SYSTEM</span>
        <span class="bc-sep">/</span>
        <span class="bc-item bc-link" id="bc-parent">${parentName}</span>
        <span class="bc-sep">/</span>
        <span class="bc-item active">${data.name.toUpperCase()}</span>
      `;

      const bcSolar = document.getElementById('bc-solar');
      if (bcSolar) bcSolar.addEventListener('click', () => {
        if (this.onSelectObject) this.onSelectObject(null);
      });

      const bcParent = document.getElementById('bc-parent');
      if (bcParent) bcParent.addEventListener('click', () => {
        if (this.onSelectObject) this.onSelectObject(data.parentPlanetId);
      });

    } else {
      this.breadcrumbContainer.innerHTML = `
        <span class="bc-item bc-link" id="bc-solar">SOLAR SYSTEM</span>
        <span class="bc-sep">/</span>
        <span class="bc-item active">${data.name.toUpperCase()}</span>
      `;

      const bcSolar = document.getElementById('bc-solar');
      if (bcSolar) bcSolar.addEventListener('click', () => {
        if (this.onSelectObject) this.onSelectObject(null);
      });
    }
  }

  toggleObjectsDrawer() {
    if (this.objectsMenu) {
      this.objectsMenu.classList.toggle('visible');
    }
  }

  closeObjectsDrawer() {
    if (this.objectsMenu) {
      this.objectsMenu.classList.remove('visible');
    }
  }
}
