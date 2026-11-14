export class GameRenderer {
  constructor(state, simulation, prediction, playerRenderer, cameraController, hudRenderer, soundManager, THREE) {
    this.state = state;
    this.simulation = simulation;
    this.prediction = prediction;
    this.playerRenderer = playerRenderer;
    this.cameraController = cameraController;
    this.hudRenderer = hudRenderer;
    this.soundManager = soundManager;
    this.THREE = THREE;
  }

  draw() {
    const state = this.state;
    const now = performance.now();
    const deltaSeconds = Math.min(0.05, (now - state.lastDrawTime) / 1000);
    state.lastDrawTime = now;

    if (state.keys.q) state.yaw -= 2.4 * deltaSeconds;
    if (state.keys.e) state.yaw += 2.4 * deltaSeconds;

    const snapshot = state.isHost
      ? this.simulation.createHostRenderSnapshot(deltaSeconds)
      : this.prediction.update(deltaSeconds);

    if (snapshot && snapshot.sh !== undefined) {
      if (snapshot.sh > state.previousShots) {
        let newShots = snapshot.sh - state.previousShots;
        const locallyPredicted = Math.min(newShots, state.pendingShots);
        state.pendingShots -= locallyPredicted;
        newShots -= locallyPredicted;
        if (newShots > 0) this.soundManager.playShot();
      }
      state.previousShots = snapshot.sh;
    }

    const canvas = document.getElementById("c");
    const context = state.hudContext;
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    context.clearRect(0, 0, canvasWidth, canvasHeight);

    if (!snapshot) {
      state.renderer.render(state.scene, state.camera);
      context.fillStyle = "#fff";
      context.font = "20px sans-serif";
      context.textAlign = "center";
      context.fillText("Waiting for host...", canvasWidth / 2, canvasHeight / 2);
      return;
    }

    this.playerRenderer.update(snapshot.p, deltaSeconds);
    this.playerRenderer.updateBullets(snapshot.b);

    const localPlayerRow = snapshot.p.find(player => player[0] === state.myId);
    this.cameraController.update(localPlayerRow);
    state.renderer.render(state.scene, state.camera);

    this.hudRenderer.draw(
      snapshot.p,
      localPlayerRow,
      canvasWidth,
      canvasHeight,
      deltaSeconds
    );
  }

  startAnimationLoop() {
    const renderFrame = () => {
      this.draw();
      this.state.animationFrame = window.requestAnimationFrame(renderFrame);
    };
    renderFrame();
  }
}
