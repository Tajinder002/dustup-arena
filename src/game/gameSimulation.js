import { RELOAD_SECONDS, MAGAZINE_SIZE } from "../config/gameConfig.js?v=city-combat-v2";
import { PlayerMovement } from "../players/playerMovement.js?v=city-combat-v2";
import { PlayerCombat } from "../players/playerCombat.js?v=city-combat-v2";
import { PlayerManager } from "../players/playerManager.js?v=city-combat-v2";
import { BulletManager } from "./bulletManager.js?v=city-combat-v2";

export class GameSimulation {
  constructor(state, collisionManager) {
    this.state = state;
    this.collisionManager = collisionManager;
    this.playerManager = new PlayerManager(state, collisionManager);
    this.playerMovement = new PlayerMovement(state, collisionManager);
    this.playerCombat = new PlayerCombat(state);
    this.bulletManager = new BulletManager(state, collisionManager);
  }

  addPlayer(playerId, name) {
    return this.playerManager.addPlayer(playerId, name);
  }

  movePlayer(player, deltaX, deltaY) {
    this.collisionManager.move(player, deltaX, deltaY);
  }

  step(deltaSeconds) {
    const state = this.state;
    for (const [playerId, player] of Object.entries(state.players)) {
      const input = state.inputs[playerId] || {};

      if (player.deadTimer > 0) {
        player.deadTimer -= deltaSeconds;
        if (player.deadTimer <= 0) {
          const [x, y] = this.collisionManager.findSpawnPoint();
          player.x = x;
          player.y = y;
          player.health = 100;
          player.deadTimer = 0;
          player.z = 0;
          player.verticalVelocity = 0;
          player.ammo = MAGAZINE_SIZE;
          player.reloadTimer = 0;
          player.ign = 0.5;
        }
        continue;
      }

      this.playerMovement.applyMovement(player, input, deltaSeconds, true, playerId);
      this.playerCombat.update(player, input, playerId, deltaSeconds);
    }

    this.bulletManager.update(deltaSeconds);
  }

  createSnapshot() {
    const state = this.state;
    return {
      p: Object.entries(state.players).map(([playerId, player]) => [
        playerId,
        player.x | 0,
        player.y | 0,
        +player.angle.toFixed(2),
        player.health,
        player.kills,
        player.deaths,
        player.name,
        player.colorIndex,
        player.deadTimer > 0 ? 1 : 0,
        player.z | 0,
        player.ammo,
        player.reloadTimer > 0
          ? Math.max(1, Math.round(100 - player.reloadTimer / RELOAD_SECONDS * 100))
          : 0,
        player.cheatGun ? 1 : 0
      ]),
      b: state.bullets.map(bullet => [
        bullet.x | 0, bullet.y | 0, bullet.z | 0,
        bullet.vx | 0, bullet.vy | 0, bullet.vz | 0,
        bullet.colorIndex
      ]),
      sh: state.shotsFired,
      m: state.mapIndex,
      v: state.version,
      t: performance.now() / 1000
    };
  }

  broadcast() {
    const snapshot = this.createSnapshot();
    const serializedSizeGuard = 16000;

    for (const connection of Object.values(this.state.connections)) {
      if (
        connection.open
        && !(connection.dataChannel && connection.dataChannel.bufferedAmount > serializedSizeGuard)
      ) {
        connection.send(snapshot);
      }
    }
    this.state.snapshot = snapshot;
  }

  createHostRenderSnapshot(deltaSeconds) {
    const state = this.state;
    return {
      p: Object.entries(state.players).map(([playerId, player]) => {
        const drawPosition = state.hostDrawPositions[playerId]
          || (state.hostDrawPositions[playerId] = { x: player.x, y: player.y });

        if (
          playerId === state.myId
          || player.deadTimer > 0
          || Math.hypot(player.x - drawPosition.x, player.y - drawPosition.y) > 150
        ) {
          drawPosition.x = player.x;
          drawPosition.y = player.y;
        } else {
          const smoothing = Math.min(1, deltaSeconds * 18);
          drawPosition.x += (player.x - drawPosition.x) * smoothing;
          drawPosition.y += (player.y - drawPosition.y) * smoothing;
        }

        return [
          playerId, drawPosition.x, drawPosition.y, player.angle,
          player.health, player.kills, player.deaths, player.name,
          player.colorIndex, player.deadTimer > 0 ? 1 : 0, player.z,
          player.ammo,
          player.reloadTimer > 0
            ? Math.max(1, Math.round(100 - player.reloadTimer / RELOAD_SECONDS * 100))
            : 0,
          player.cheatGun ? 1 : 0
        ];
      }),
      b: state.bullets.map(bullet => [bullet.x, bullet.y, bullet.z]),
      sh: state.shotsFired
    };
  }
}
