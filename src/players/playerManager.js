import { PLAYER_COLORS } from "../config/gameConfig.js";
import { createPlayerRecord } from "./player.js";

export class PlayerManager {
  constructor(state, collisionManager) {
    this.state = state;
    this.collisionManager = collisionManager;
  }

  makeUniqueName(value) {
    const baseName = (value || "Player").trim().slice(0, 12) || "Player";
    const takenNames = new Set(
      Object.values(this.state.players).map(player => player.name.toLowerCase())
    );
    if (!takenNames.has(baseName.toLowerCase())) return baseName;

    for (let suffix = 2; ; suffix += 1) {
      const suffixText = String(suffix);
      const candidate = `${baseName.slice(0, 12 - suffixText.length)}${suffixText}`;
      if (!takenNames.has(candidate.toLowerCase())) return candidate;
    }
  }

  addPlayer(playerId, requestedName) {
    const [x, y] = this.collisionManager.findSpawnPoint();
    const occupiedColors = Object.values(this.state.players).map(player => player.colorIndex);
    let colorIndex = 0;
    while (occupiedColors.includes(colorIndex)) colorIndex += 1;

    const player = createPlayerRecord(
      this.makeUniqueName(requestedName),
      colorIndex % PLAYER_COLORS.length,
      x,
      y
    );
    this.state.players[playerId] = player;
    return player;
  }
}
