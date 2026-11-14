import {
  PLAYER_RADIUS, WALL_COLLISION_RADIUS
} from "../config/gameConfig.js";
import { randomInteger, clamp } from "../utils/math.js";

export class CollisionManager {
  constructor(state) {
    this.state = state;
  }

  wallAt(x, y, radius) {
    const walls = this.state.walls;
    for (let index = 0; index < walls.length; index += 1) {
      const [left, top, width, height] = walls[index];
      const closestX = clamp(x, left, left + width);
      const closestY = clamp(y, top, top + height);
      if ((x - closestX) ** 2 + (y - closestY) ** 2 < radius ** 2) return index;
    }
    return -1;
  }

  hitsWall(x, y, radius) {
    return this.wallAt(x, y, radius) >= 0;
  }

  move(entity, deltaX, deltaY) {
    const nextX = clamp(entity.x + deltaX, PLAYER_RADIUS, this.state.worldWidth - PLAYER_RADIUS);
    if (!this.hitsWall(nextX, entity.y, PLAYER_RADIUS)) entity.x = nextX;

    const nextY = clamp(entity.y + deltaY, PLAYER_RADIUS, this.state.worldHeight - PLAYER_RADIUS);
    if (!this.hitsWall(entity.x, nextY, PLAYER_RADIUS)) entity.y = nextY;
  }

  findSpawnPoint() {
    for (let attempt = 0; attempt < 50; attempt += 1) {
      const x = PLAYER_RADIUS + randomInteger(this.state.worldWidth - 2 * PLAYER_RADIUS);
      const y = PLAYER_RADIUS + randomInteger(this.state.worldHeight - 2 * PLAYER_RADIUS);
      if (!this.hitsWall(x, y, PLAYER_RADIUS + 20)) return [x, y];
    }
    return [50, 50];
  }

  isValidRemotePosition(x, y) {
    return typeof x === "number"
      && typeof y === "number"
      && x >= PLAYER_RADIUS
      && x <= this.state.worldWidth - PLAYER_RADIUS
      && y >= PLAYER_RADIUS
      && y <= this.state.worldHeight - PLAYER_RADIUS
      && !this.hitsWall(x, y, WALL_COLLISION_RADIUS);
  }
}
