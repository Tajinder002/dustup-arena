import { PLAYER_SPEED, PLAYER_RADIUS, MAGAZINE_SIZE } from "../config/gameConfig.js";

export class ClientPrediction {
  constructor(state, collisionManager, soundManager, localInput) {
    this.state = state;
    this.collisionManager = collisionManager;
    this.soundManager = soundManager;
    this.localInput = localInput;
  }

  update(deltaSeconds) {
    const state = this.state;
    const latestSnapshot = state.snapshots[state.snapshots.length - 1];
    if (!latestSnapshot) return null;

    const now = performance.now() / 1000;
    const renderTime = now - state.offset - 0.12;
    let activeIndex = -1;
    for (let index = 0; index < state.snapshots.length; index += 1) {
      if (state.snapshots[index].t <= renderTime) activeIndex = index;
      else break;
    }

    let snapshotA = state.snapshots[Math.max(activeIndex, 0)];
    let snapshotB = state.snapshots[Math.min(activeIndex + 1, state.snapshots.length - 1)];
    const extrapolating = activeIndex >= state.snapshots.length - 1 && state.snapshots.length > 1;
    if (extrapolating) {
      snapshotA = state.snapshots[state.snapshots.length - 2];
      snapshotB = state.snapshots[state.snapshots.length - 1];
    }

    const interpolation = snapshotB.t > snapshotA.t
      ? Math.min(extrapolating ? 1.5 : 1, Math.max(0, (renderTime - snapshotA.t) / (snapshotB.t - snapshotA.t)))
      : 0;

    const interpolatedPlayers = latestSnapshot.p.map(row => {
      const previousRow = snapshotA.p.find(candidate => candidate[0] === row[0]);
      const nextRow = snapshotB.p.find(candidate => candidate[0] === row[0]);
      let x = row[1];
      let y = row[2];
      let angle = row[3];
      let z = row[10] || 0;

      if (previousRow && nextRow && Math.hypot(nextRow[1] - previousRow[1], nextRow[2] - previousRow[2]) < 200) {
        x = previousRow[1] + (nextRow[1] - previousRow[1]) * interpolation;
        y = previousRow[2] + (nextRow[2] - previousRow[2]) * interpolation;
        let angleDelta = nextRow[3] - previousRow[3];
        angleDelta = Math.atan2(Math.sin(angleDelta), Math.cos(angleDelta));
        angle = previousRow[3] + angleDelta * interpolation;
        z = (previousRow[10] || 0) + ((nextRow[10] || 0) - (previousRow[10] || 0)) * interpolation;
      } else if (nextRow) {
        x = nextRow[1];
        y = nextRow[2];
        angle = nextRow[3];
      }

      return [
        row[0], x, y, angle, row[4], row[5], row[6], row[7],
        row[8], row[9], z, row[11], row[12], row[13]
      ];
    });

    const authoritativePlayer = latestSnapshot.p.find(row => row[0] === state.myId);
    const localPlayerRow = interpolatedPlayers.find(row => row[0] === state.myId);

    if (authoritativePlayer && localPlayerRow) {
      const respawned = state.wasDead && !authoritativePlayer[9];
      state.wasDead = !!authoritativePlayer[9];

      if (
        !state.localPlayer
        || authoritativePlayer[9]
        || respawned
        || Math.hypot(authoritativePlayer[1] - state.localPlayer.x, authoritativePlayer[2] - state.localPlayer.y) > 900
      ) {
        state.localPlayer = { x: authoritativePlayer[1], y: authoritativePlayer[2] };
        state.localZ = 0;
        state.localVerticalVelocity = 0;
      } else {
        const input = this.localInput();
        const magnitude = Math.hypot(input.mx, input.my) || 1;
        this.collisionManager.move(
          state.localPlayer,
          input.mx / magnitude * PLAYER_SPEED * deltaSeconds,
          input.my / magnitude * PLAYER_SPEED * deltaSeconds
        );

        if (this.collisionManager.hitsWall(state.localPlayer.x, state.localPlayer.y, PLAYER_RADIUS - 2)) {
          state.localPlayer = { x: authoritativePlayer[1], y: authoritativePlayer[2] };
        } else {
          const errorX = authoritativePlayer[1] - state.localPlayer.x;
          const errorY = authoritativePlayer[2] - state.localPlayer.y;
          const errorDistance = Math.hypot(errorX, errorY);
          if (errorDistance > 40) {
            const correction = Math.min(1, deltaSeconds * 6);
            state.localPlayer.x += errorX * correction;
            state.localPlayer.y += errorY * correction;
          }
        }
      }

      const input = this.localInput();
      if (input.j && state.localZ <= 0) state.localVerticalVelocity = 420;
      state.localVerticalVelocity -= 1100 * deltaSeconds;
      state.localZ += state.localVerticalVelocity * deltaSeconds;
      if (state.localZ <= 0) {
        state.localZ = 0;
        state.localVerticalVelocity = 0;
      }
      if (Math.abs(state.localZ - (authoritativePlayer[10] || 0)) > 200) {
        state.localZ = authoritativePlayer[10] || 0;
      }

      localPlayerRow[1] = state.localPlayer.x;
      localPlayerRow[2] = state.localPlayer.y;
      localPlayerRow[3] = input.a;
      localPlayerRow[10] = state.localZ;

      // Predict the local shot so firing feedback does not wait for a network round trip.
      state.localShotCooldown -= deltaSeconds;
      if (now - state.lastLocalShotAt > 0.5) state.localAmmo = authoritativePlayer[11] ?? MAGAZINE_SIZE;
      if (now - state.lastLocalShotAt > 1) state.pendingShots = 0;
      if (authoritativePlayer[9]) state.localBullets.length = 0;

      const hasCheatGun = !!authoritativePlayer[13];
      if (
        !authoritativePlayer[9]
        && input.s
        && state.localShotCooldown <= 0
        && (hasCheatGun || (state.localAmmo > 0 && !(localPlayerRow[12] > 0)))
      ) {
        state.localShotCooldown = hasCheatGun ? 0.07 : 0.2;
        const cosine = Math.cos(input.a);
        const sine = Math.sin(input.a);
        const cosinePitch = Math.cos(state.pitch);
        const sinePitch = Math.sin(state.pitch);
        state.localBullets.push({
          x: state.localPlayer.x - sine * 10 + cosine * PLAYER_RADIUS,
          y: state.localPlayer.y + cosine * 10 + sine * PLAYER_RADIUS,
          z: state.localZ + 36,
          vx: cosine * cosinePitch * 1000,
          vy: sine * cosinePitch * 1000,
          vz: sinePitch * 1000,
          lifetime: 2
        });
        if (!hasCheatGun) state.localAmmo = Math.max(0, state.localAmmo - 1);
        state.lastLocalShotAt = now;
        state.pendingShots = Math.min(state.pendingShots + 1, 10);
        this.soundManager.playShot();
      }

      localPlayerRow[11] = state.localAmmo;
    }

    for (let index = state.localBullets.length - 1; index >= 0; index -= 1) {
      const bullet = state.localBullets[index];
      bullet.x += bullet.vx * deltaSeconds;
      bullet.y += bullet.vy * deltaSeconds;
      bullet.z += bullet.vz * deltaSeconds;
      bullet.lifetime -= deltaSeconds;
      const wallIndex = this.collisionManager.wallAt(bullet.x, bullet.y, 3);
      if (
        bullet.lifetime <= 0
        || bullet.z < 0
        || bullet.x < 0
        || bullet.y < 0
        || bullet.x > state.worldWidth
        || bullet.y > state.worldHeight
        || (wallIndex >= 0 && bullet.z < state.wallHeights[wallIndex])
      ) {
        state.localBullets.splice(index, 1);
      }
    }

    const localColor = authoritativePlayer ? authoritativePlayer[8] : -1;
    const elapsedSinceSnapshot = Math.min(0.12, now - latestSnapshot.rt);
    const remoteBullets = latestSnapshot.b
      .filter(bullet => bullet[6] !== localColor)
      .map(bullet => [
        bullet[0] + bullet[3] * elapsedSinceSnapshot,
        bullet[1] + bullet[4] * elapsedSinceSnapshot,
        bullet[2] + bullet[5] * elapsedSinceSnapshot
      ]);

    return {
      p: interpolatedPlayers,
      b: remoteBullets.concat(state.localBullets.map(bullet => [bullet.x, bullet.y, bullet.z])),
      sh: latestSnapshot.sh
    };
  }
}
