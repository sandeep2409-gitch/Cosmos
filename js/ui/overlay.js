/**
 * Header Action Buttons Manager
 */
export class UIOverlay {
  constructor() {
    this.onResetCallback = null;
    this.onFocusCallback = null;

    this.bindHeaderControls();
  }

  bindHeaderControls() {
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

  setFocusButtonVisible(visible) {
    const focusBtn = document.getElementById('hdr-btn-focus');
    if (focusBtn) {
      if (visible) focusBtn.classList.remove('hidden');
      else focusBtn.classList.add('hidden');
    }
  }
}
