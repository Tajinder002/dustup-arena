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
      bullet.x += bullet.vx * deltaSeconds;
      bullet.y += bullet.vy * deltaSeconds;
      bullet.z += bullet.vz * deltaSeconds;
      bullet.lifetime -= deltaSeconds;

      const wallIndex = this.collisionManager.wallAt(bullet.x, bullet.y, 3);
      let shouldRemove = bullet.lifetime <= 0
        || bullet.z < 0
        || bullet.x < 0
        || bullet.y < 0
        || bullet.x > worldWidth
        || bullet.y > worldHeight
        || (wallIndex >= 0 && bullet.z < wallHeights[wallIndex]);

      if (!shouldRemove) {
        for (const [playerId, player] of Object.entries(players)) {
          if (playerId === bullet.ownerId || player.deadTimer > 0) continue;

          const hitDistanceSquared = (player.x - bullet.x) ** 2 + (player.y - bullet.y) ** 2;
          if (
            hitDistanceSquared < (PLAYER_RADIUS + 3) ** 2
            && bullet.z > player.z
            && bullet.z < player.z + 42
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

      if (shouldRemove) bullets.splice(index, 1);
    }
  }
}
