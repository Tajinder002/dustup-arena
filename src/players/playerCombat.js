import { MAGAZINE_SIZE, RELOAD_SECONDS, BULLET_SPEED } from "../config/gameConfig.js?v=pubg-aim-v1";
import { getThirdPersonAimRay } from "../game/aiming.js?v=pubg-aim-v1";

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
      const aimRay = getThirdPersonAimRay(player, player.angle, player.pitch);
      this.state.bullets.push({
        x: aimRay.origin.x,
        y: aimRay.origin.y,
        z: aimRay.origin.z,
        vx: aimRay.direction.x * BULLET_SPEED,
        vy: aimRay.direction.y * BULLET_SPEED,
        vz: aimRay.direction.z * BULLET_SPEED,
        ownerId: playerId,
        colorIndex: player.colorIndex,
        lifetime: 2
      });
    }
  }
}
