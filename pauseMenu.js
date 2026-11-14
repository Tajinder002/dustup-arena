import { $ } from "../utils/dom.js";

export class PauseMenu {
  constructor(state, canvas, inputManager) {
    this.state = state;
    this.canvas = canvas;
    this.inputManager = inputManager;
  }

  setPaused(isPaused) {
    this.state.paused = isPaused;
    $("pause").style.display = isPaused ? "flex" : "none";
    if (isPaused) this.state.mouse.down = false;
  }

  requestPointerLock() {
    if (this.state.isTouch || !this.canvas.requestPointerLock) return;
    try {
      const result = this.canvas.requestPointerLock();
      result?.catch?.(() => {});
    } catch (error) {
      console.debug("Could not reacquire pointer lock:", error);
    }
  }

  bind() {
    document.addEventListener("pointerlockchange", () => {
      this.state.lastPointerLockChange = performance.now();
      if (
        document.pointerLockElement !== this.canvas
        && $("game").style.display === "flex"
        && !this.state.isTouch
      ) {
        this.setPaused(true);
      }
    });

    window.addEventListener("keydown", event => {
      if (
        event.key === "Escape"
        && $("game").style.display === "flex"
        && performance.now() - this.state.lastPointerLockChange > 250
      ) {
        const wasPaused = this.state.paused;
        this.setPaused(!this.state.paused);
        if (wasPaused) this.requestPointerLock();
      }
    });

    $("resume").addEventListener("click", () => {
      this.setPaused(false);
      this.requestPointerLock();
    });
    $("leave").addEventListener("click", () => {
      window.location.href = window.location.pathname;
    });
    $("bp").addEventListener("click", () => this.setPaused(true));
  }
}
