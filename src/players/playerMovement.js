import { PLAYER_SPEED } from "../config/gameConfig.js?v=city-combat-v2";

export class PlayerMovement {
  constructor(state, collisionManager) {
    this.state = state;
    this.collisionManager = collisionManager;
  }

  applyMovement(player, input, deltaSeconds, allowRemoteCorrection = false, playerId = null) {
    let deltaX = input.mx || 0;
    let deltaY = input.my || 0;
    const magnitude = Math.hypot(deltaX, deltaY) || 1;

    player.ign = Math.max(0, (player.ign || 0) - deltaSeconds);
    if (
      allowRemoteCorrection
      && playerId !== this.state.myId
      && !player.ign
      && this.collisionManager.isValidRemotePosition(input.x, input.y)
      && Math.hypot(input.x - player.x, input.y - player.y) < 900
    ) {
      player.x = input.x;
      player.y = input.y;
    } else {
      this.collisionManager.move(
        player,
        (deltaX / magnitude) * PLAYER_SPEED * deltaSeconds,
        (deltaY / magnitude) * PLAYER_SPEED * deltaSeconds
      );
    }

    if (typeof input.a === "number") player.angle = input.a;
    if (typeof input.p === "number") player.pitch = Math.max(-1.2, Math.min(1.2, input.p));

    if (input.j && player.z <= 0) player.verticalVelocity = 420;
    player.verticalVelocity -= 1100 * deltaSeconds;
    player.z += player.verticalVelocity * deltaSeconds;
    if (player.z <= 0) {
      player.z = 0;
      player.verticalVelocity = 0;
    }
  }
}
