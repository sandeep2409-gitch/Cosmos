/**
 * Controls & Help Modal Component
 */
export class HelpModal {
  constructor() {
    this.modal = document.getElementById('modal-help');
    this.closeBtn = document.getElementById('help-close-btn');

    this.init();
  }

  init() {
    if (this.closeBtn && this.modal) {
      this.closeBtn.addEventListener('click', () => this.hide());
    }
  }

  show() {
    if (this.modal) this.modal.classList.add('visible');
  }

  hide() {
    if (this.modal) this.modal.classList.remove('visible');
  }

  toggle() {
    if (this.modal) this.modal.classList.toggle('visible');
  }
}
