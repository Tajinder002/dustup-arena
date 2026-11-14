import { PLAYER_RADIUS, MAGAZINE_SIZE } from "../config/gameConfig.js";

export function createPlayerRecord(name, colorIndex, x, y) {
  return {
    x,
    y,
    angle: 0,
    health: 100,
    kills: 0,
    deaths: 0,
    name,
    colorIndex,
    deadTimer: 0,
    shotCooldown: 0,
    z: 0,
    verticalVelocity: 0,
    pitch: 0,
    ammo: MAGAZINE_SIZE,
    reloadTimer: 0,
    cheatGun: false,
    radius: PLAYER_RADIUS
  };
}
