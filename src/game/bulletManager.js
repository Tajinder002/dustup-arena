import { PLAYER_RADIUS } from "../config/gameConfig.js";

export class BulletManager {
  constructor(state, collisionManager) {
    this.state = state;
    this.collisionManager = collisionManager;
  }

  update(deltaSeconds) {
    const { bullets, players, worldWidth, worldHeight, wallHeights } = this.state;

    for (let index = bullets.length - 1; index >= 0; index -= 1) {
      const bullet = bullets[index];
      const startX = bullet.x;
      const startY = bullet.y;
      const startZ = bullet.z;
      const deltaX = bullet.vx * deltaSeconds;
      const deltaY = bullet.vy * deltaSeconds;
      const deltaZ = bullet.vz * deltaSeconds;
      const distance = Math.hypot(deltaX, deltaY, deltaZ);
      const steps = Math.max(1, Math.ceil(distance / 7));
      bullet.lifetime -= deltaSeconds;

      let shouldRemove = bullet.lifetime <= 0;
      for (let step = 1; step <= steps && !shouldRemove; step += 1) {
        const progress = step / steps;
        bullet.x = startX + deltaX * progress;
        bullet.y = startY + deltaY * progress;
        bullet.z = startZ + deltaZ * progress;

        if (
          bullet.z < 0
          || bullet.x < 0
          || bullet.y < 0
          || bullet.x > worldWidth
          || bullet.y > worldHeight
        ) {
          shouldRemove = true;
          break;
        }

        const wallIndex = this.collisionManager.wallAt(bullet.x, bullet.y, 3);
        if (wallIndex >= 0 && bullet.z < wallHeights[wallIndex]) {
          shouldRemove = true;
          break;
        }

        for (const [playerId, player] of Object.entries(players)) {
          if (playerId === bullet.ownerId || player.deadTimer > 0) continue;
          const hitDistanceSquared = (player.x - bullet.x) ** 2 + (player.y - bullet.y) ** 2;
          if (
            hitDistanceSquared < (PLAYER_RADIUS + 4) ** 2
            && bullet.z >= player.z + 1
            && bullet.z <= player.z + 43
          ) {
            const shooter = players[bullet.ownerId];
            player.health -= shooter?.cheatGun ? 100 : 25;
            shouldRemove = true;

            if (player.health <= 0) {
              player.deadTimer = 3;
              player.deaths += 1;
              if (shooter) {
                shooter.kills += 1;
                shooter.health = 100;
              }
            }
            break;
          }
        }
      }

      if (shouldRemove) {
        bullets.splice(index, 1);
      } else {
        bullet.x = startX + deltaX;
        bullet.y = startY + deltaY;
        bullet.z = startZ + deltaZ;
      }
    }
  }
}
