/**
 * Header Action Buttons & Scale Mode Toggle Manager
 * Binds cleanly to the existing HTML header element in index.html (No Duplicate Headers).
 */
export class UIOverlay {
  constructor() {
    this.onResetCallback = null;
    this.onFocusCallback = null;
    this.onScaleToggleCallback = null;

    this.scaleMode = 'visual'; // 'visual' vs 'real'

    this.bindHeaderControls();
  }

  bindHeaderControls() {
    const scaleBtn = document.getElementById('hdr-btn-scale');
    if (scaleBtn) {
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
    }

    const resetBtn = document.getElementById('hdr-btn-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (this.onResetCallback) this.onResetCallback();
      });
    }

    const focusBtn = document.getElementById('hdr-btn-focus');
    if (focusBtn) {
      focusBtn.addEventListener('click', () => {
        if (this.onFocusCallback) this.onFocusCallback();
      });
    }
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
