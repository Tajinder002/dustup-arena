import { MAGAZINE_SIZE, RELOAD_SECONDS } from "../config/gameConfig.js";

export class PlayerCombat {
  constructor(state) {
    this.state = state;
  }

  update(player, input, playerId, deltaSeconds) {
    player.shotCooldown -= deltaSeconds;

    if (player.reloadTimer > 0) {
      player.reloadTimer -= deltaSeconds;
      if (player.reloadTimer <= 0) {
        player.reloadTimer = 0;
        player.ammo = MAGAZINE_SIZE;
      }
    } else if (input.r && player.ammo < MAGAZINE_SIZE) {
      player.reloadTimer = RELOAD_SECONDS;
    }

    if (input.s && player.shotCooldown <= 0 && player.reloadTimer <= 0 && player.ammo > 0) {
      player.shotCooldown = player.cheatGun ? 0.07 : 0.2;
      if (!player.cheatGun) {
        player.ammo -= 1;
        if (player.ammo <= 0) player.reloadTimer = RELOAD_SECONDS;
      }

      this.state.shotsFired += 1;
      const cosineAngle = Math.cos(player.angle);
      const sineAngle = Math.sin(player.angle);
      const cosinePitch = Math.cos(player.pitch);
      const sinePitch = Math.sin(player.pitch);
      const radius = player.radius;

      this.state.bullets.push({
        x: player.x - sineAngle * 10 + cosineAngle * radius,
        y: player.y + cosineAngle * 10 + sineAngle * radius,
        z: player.z + 36,
        vx: cosineAngle * cosinePitch * 1000,
        vy: sineAngle * cosinePitch * 1000,
        vz: sinePitch * 1000,
        ownerId: playerId,
        colorIndex: player.colorIndex,
        lifetime: 2
      });
    }
  }
}
