import {
  CAMERA_AIM_HEIGHT,
  CAMERA_DISTANCE,
  CAMERA_FOCUS_DISTANCE,
  CAMERA_MIN_DISTANCE,
  CAMERA_SHOULDER_OFFSET
} from "../config/gameConfig.js?v=pubg-aim-v1";

export class CameraController {
  constructor(state, collisionManager) {
    this.state = state;
    this.collisionManager = collisionManager;
  }

  update(localPlayerRow) {
    if (!localPlayerRow) return;

    const state = this.state;
    const yaw = state.yaw;
    const cosinePitch = Math.cos(state.pitch);
    const sinePitch = Math.sin(state.pitch);
    const forwardX = Math.cos(yaw);
    const forwardZ = Math.sin(yaw);

    // Offset the camera to Steve's right shoulder, behind and above him.
    // The crosshair ray is aligned with the same yaw/pitch used by shooting.
    const shoulderX = -Math.sin(yaw) * CAMERA_SHOULDER_OFFSET;
    const shoulderZ = Math.cos(yaw) * CAMERA_SHOULDER_OFFSET;
    const playerX = localPlayerRow[1] + shoulderX;
    const playerZ = localPlayerRow[2] + shoulderZ;
    const cameraY = (localPlayerRow[10] || 0) + CAMERA_AIM_HEIGHT;

    let cameraDistance = CAMERA_DISTANCE;
    const cameraBlocked = distance => {
      const wallIndex = this.collisionManager.wallAt(
        playerX - forwardX * distance,
        playerZ - forwardZ * distance,
        5
      );
      return wallIndex >= 0 && cameraY < state.wallHeights[wallIndex];
    };

    while (cameraDistance > CAMERA_MIN_DISTANCE && cameraBlocked(cameraDistance)) {
      cameraDistance -= 10;
    }
    state.cameraDistance = cameraDistance;

    state.camera.position.set(
      playerX - forwardX * cameraDistance,
      Math.max(12, cameraY),
      playerZ - forwardZ * cameraDistance
    );
    state.camera.lookAt(
      state.camera.position.x + forwardX * cosinePitch * CAMERA_FOCUS_DISTANCE,
      state.camera.position.y + sinePitch * CAMERA_FOCUS_DISTANCE,
      state.camera.position.z + forwardZ * cosinePitch * CAMERA_FOCUS_DISTANCE
    );

    const localModel = state.playerMeshes[state.myId];
    if (localModel) localModel.visible = !localPlayerRow[9] && cameraDistance > 45;
  }
}
