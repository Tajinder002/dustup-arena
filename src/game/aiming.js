import {
  AIM_TARGET_DISTANCE,
  CAMERA_AIM_HEIGHT,
  CAMERA_DISTANCE,
  CAMERA_SHOULDER_OFFSET,
  PLAYER_RADIUS
} from "../config/gameConfig.js?v=pubg-aim-v1";

/**
 * Build a ray from Steve's rifle muzzle through the centre of the over-shoulder
 * camera. This makes the bullet converge on the screen-centre reticle instead
 * of travelling parallel to the offset camera ray.
 *
 * Coordinates: x/y are the ground plane; z is vertical height.
 */
export function getThirdPersonAimRay(player, angle, pitch = 0, cameraDistanceOverride = null) {
  const safeAngle = Number.isFinite(angle) ? angle : 0;
  const safePitch = Math.max(-1.2, Math.min(1.2, Number.isFinite(pitch) ? pitch : 0));
  const cosinePitch = Math.cos(safePitch);
  const sinePitch = Math.sin(safePitch);
  const forwardX = Math.cos(safeAngle) * cosinePitch;
  const forwardY = Math.sin(safeAngle) * cosinePitch;
  const rightX = -Math.sin(safeAngle);
  const rightY = Math.cos(safeAngle);
  const playerHeight = Number.isFinite(player.z) ? player.z : 0;
  const cameraDistance = Number.isFinite(cameraDistanceOverride)
    ? Math.max(75, Math.min(CAMERA_DISTANCE, cameraDistanceOverride))
    : CAMERA_DISTANCE;

  // Match CameraController's over-the-right-shoulder camera origin.
  const cameraOrigin = {
    x: player.x + rightX * CAMERA_SHOULDER_OFFSET - forwardX * cameraDistance,
    y: player.y + rightY * CAMERA_SHOULDER_OFFSET - forwardY * cameraDistance,
    z: playerHeight + CAMERA_AIM_HEIGHT - sinePitch * CAMERA_DISTANCE
  };

  // The crosshair sits in the centre of the camera view. Aim at a distant point
  // on that exact centre ray, then converge the projectile from the rifle.
  const target = {
    x: cameraOrigin.x + forwardX * AIM_TARGET_DISTANCE,
    y: cameraOrigin.y + forwardY * AIM_TARGET_DISTANCE,
    z: cameraOrigin.z + sinePitch * AIM_TARGET_DISTANCE
  };

  const radius = Number.isFinite(player.radius) ? player.radius : PLAYER_RADIUS;
  const origin = {
    x: player.x - Math.sin(safeAngle) * 10 + Math.cos(safeAngle) * radius,
    y: player.y + Math.cos(safeAngle) * 10 + Math.sin(safeAngle) * radius,
    z: playerHeight + 36
  };

  const dx = target.x - origin.x;
  const dy = target.y - origin.y;
  const dz = target.z - origin.z;
  const length = Math.hypot(dx, dy, dz) || 1;

  return {
    origin,
    target,
    cameraOrigin,
    direction: { x: dx / length, y: dy / length, z: dz / length }
  };
}
