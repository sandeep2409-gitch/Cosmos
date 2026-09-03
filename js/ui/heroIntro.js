/**
 * Hero Introduction Screen Component for COSMOS
 */
export class HeroIntro {
  constructor(onStart) {
    this.onStart = onStart;
    this.container = document.getElementById('hero-intro');
    this.startBtn = document.getElementById('hero-start-btn');
    this.skipBtn = document.getElementById('hero-skip-btn');

    this.init();
  }

  init() {
    if (!this.container) return;

    const handleStart = () => {
      this.dismiss();
    };

    if (this.startBtn) this.startBtn.addEventListener('click', handleStart);
    if (this.skipBtn) this.skipBtn.addEventListener('click', handleStart);
  }

  show() {
    if (this.container) {
      this.container.style.display = 'flex';
      this.container.classList.remove('hidden');
    }
  }

  dismiss() {
    if (this.container) {
      this.container.classList.add('fade-out');
      setTimeout(() => {
        this.container.style.display = 'none';
        if (this.onStart) this.onStart();
      }, 500);
    } else {
      if (this.onStart) this.onStart();
    }
  }
}
