/**
 * Minimal UI Overlay Manager with Real Scale Toggle & Header Controls
 */
export class UIOverlay {
  constructor() {
    this.onResetCallback = null;
    this.onFocusCallback = null;
    this.onScaleToggleCallback = null;

    this.scaleMode = 'visual'; // 'visual' vs 'real'

    this.createHeader();
    this.createControlsHint();
    this.createDisclaimer();
  }

  createHeader() {
    const header = document.createElement('header');
    header.className = 'app-header';
    header.innerHTML = `
      <div class="logo-container">
        <div class="logo-icon"></div>
        <h1 class="logo-text">COSMOS</h1>
      </div>
      <div class="logo-tagline">Interactive Solar System</div>
      <div class="header-action-buttons">
        <button class="header-btn btn-scale-toggle" id="hdr-btn-scale">📐 Real AU Scale</button>
        <button class="header-btn" id="hdr-btn-reset">🌌 Reset View</button>
        <button class="header-btn hidden" id="hdr-btn-focus">🎯 Focus</button>
      </div>
    `;
    document.body.appendChild(header);

    const scaleBtn = document.getElementById('hdr-btn-scale');
    scaleBtn.addEventListener('click', () => {
      if (this.scaleMode === 'visual') {
        this.scaleMode = 'real';
        scaleBtn.innerHTML = '🎨 Visual Scale';
        scaleBtn.classList.add('active');
      } else {
        this.scaleMode = 'visual';
        scaleBtn.innerHTML = '📐 Real AU Scale';
        scaleBtn.classList.remove('active');
      }
      if (this.onScaleToggleCallback) this.onScaleToggleCallback(this.scaleMode);
    });

    document.getElementById('hdr-btn-reset').addEventListener('click', () => {
      if (this.onResetCallback) this.onResetCallback();
    });

    document.getElementById('hdr-btn-focus').addEventListener('click', () => {
      if (this.onFocusCallback) this.onFocusCallback();
    });
  }

  createControlsHint() {
    const hint = document.createElement('div');
    hint.className = 'app-controls-hint';
    hint.innerHTML = `
      <div class="control-badge"><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> Move Camera</div>
      <div class="control-badge"><kbd>Space</kbd>/<kbd>Shift</kbd> Elevate</div>
      <div class="control-badge"><span class="mouse-icon">🖱️</span> Drag to Orbit / Click to Select</div>
    `;
    document.body.appendChild(hint);
  }

  createDisclaimer() {
    const disclaimer = document.createElement('div');
    disclaimer.className = 'app-disclaimer';
    disclaimer.id = 'app-disclaimer';
    disclaimer.innerHTML = `
      <span>Scale Mode:</span> Visual Scale active (Planetary sizes and distances adjusted). Click <b>Real AU Scale</b> for astronomical proportions.
    `;
    document.body.appendChild(disclaimer);
  }

  updateDisclaimer(mode) {
    const disclaimer = document.getElementById('app-disclaimer');
    if (disclaimer) {
      if (mode === 'real') {
        disclaimer.innerHTML = `<span>Scale Mode:</span> <b>True Astronomical Scale (AU)</b> active (Mercury 0.39 AU, Earth 1.00 AU, Neptune 30.07 AU, Sun 109x Earth).`;
      } else {
        disclaimer.innerHTML = `<span>Scale Mode:</span> Visual Scale active (Planetary sizes and distances adjusted). Click <b>Real AU Scale</b> for astronomical proportions.`;
      }
    }
  }

  setFocusButtonVisible(visible) {
    const focusBtn = document.getElementById('hdr-btn-focus');
    if (focusBtn) {
      if (visible) focusBtn.classList.remove('hidden');
      else focusBtn.classList.add('hidden');
    }
  }
}
