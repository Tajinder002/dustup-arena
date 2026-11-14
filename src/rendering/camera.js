export class CameraController {
  constructor(state, collisionManager) {
    this.state = state;
    this.collisionManager = collisionManager;
  }

  update(localPlayerRow) {
    if (!localPlayerRow) return;

    const state = this.state;
    const cosinePitch = Math.cos(state.pitch);
    const sinePitch = Math.sin(state.pitch);
    const forwardX = Math.cos(state.yaw) * cosinePitch;
    const forwardZ = Math.sin(state.yaw) * cosinePitch;
    const playerX = localPlayerRow[1] - Math.sin(state.yaw) * 11;
    const playerY = (localPlayerRow[10] || 0) + 36;
    const playerZ = localPlayerRow[2] + Math.cos(state.yaw) * 11;

    let cameraDistance = 118;
    const cameraBlocked = distance => {
      const wallIndex = this.collisionManager.wallAt(
        playerX - forwardX * distance,
        playerZ - forwardZ * distance,
        5
      );
      return wallIndex >= 0
        && Math.max(2, playerY - sinePitch * distance) < state.wallHeights[wallIndex];
    };

    while (cameraDistance > 25 && cameraBlocked(cameraDistance)) cameraDistance -= 10;

    state.camera.position.set(
      playerX - forwardX * cameraDistance,
      Math.max(3, playerY - sinePitch * cameraDistance),
      playerZ - forwardZ * cameraDistance
    );
    state.camera.lookAt(
      state.camera.position.x + forwardX * 100,
      state.camera.position.y + sinePitch * 100,
      state.camera.position.z + forwardZ * 100
    );

    const localModel = state.playerMeshes[state.myId];
    if (localModel) localModel.visible = !localPlayerRow[9] && cameraDistance > 45;
  }
}
