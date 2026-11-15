import { PLAYER_COLORS, MAGAZINE_SIZE } from "../config/gameConfig.js?v=pubg-aim-v1";

export class HudRenderer {
  constructor(state, THREE) {
    this.state = state;
    this.THREE = THREE;
    this.projectedPosition = new THREE.Vector3();
  }

  drawPlayerLabels(playerRows, canvasWidth, canvasHeight) {
    const state = this.state;
    const context = state.hudContext;
    context.textAlign = "center";
    context.font = "bold 13px 'Chakra Petch', sans-serif";

    for (const [playerId, x, y, angle, health, kills, deaths, name, colorIndex, dead, z] of playerRows) {
      if (playerId === state.myId || dead) continue;
      this.projectedPosition.set(x, 48 + (z || 0), y).project(state.camera);
      if (this.projectedPosition.z > 1) continue;

      const screenX = (this.projectedPosition.x + 1) / 2 * canvasWidth;
      const screenY = (1 - this.projectedPosition.y) / 2 * canvasHeight;
      context.fillStyle = "#161a22";
      context.fillRect(screenX - 20, screenY - 12, 40, 5);
      context.fillStyle = health > 40 ? "#06d6a0" : "#ff6b57";
      context.fillRect(screenX - 20, screenY - 12, 40 * health / 100, 5);
      context.fillStyle = "#fff";
      context.fillText(name, screenX, screenY - 16);
    }
  }

  drawCrosshair(canvasWidth, canvasHeight) {
    const context = this.state.hudContext;
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    context.lineCap = "square";
    context.strokeStyle = "rgba(0, 0, 0, 0.72)";
    context.lineWidth = 4;
    context.beginPath();
    context.moveTo(centerX - 11, centerY);
    context.lineTo(centerX - 5, centerY);
    context.moveTo(centerX + 5, centerY);
    context.lineTo(centerX + 11, centerY);
    context.moveTo(centerX, centerY - 11);
    context.lineTo(centerX, centerY - 5);
    context.moveTo(centerX, centerY + 5);
    context.lineTo(centerX, centerY + 11);
    context.stroke();

    context.strokeStyle = "#f7f8fa";
    context.lineWidth = 1.6;
    context.beginPath();
    context.moveTo(centerX - 11, centerY);
    context.lineTo(centerX - 5, centerY);
    context.moveTo(centerX + 5, centerY);
    context.lineTo(centerX + 11, centerY);
    context.moveTo(centerX, centerY - 11);
    context.lineTo(centerX, centerY - 5);
    context.moveTo(centerX, centerY + 5);
    context.lineTo(centerX, centerY + 11);
    context.stroke();
    context.fillStyle = "#fff";
    context.beginPath();
    context.arc(centerX, centerY, 1.7, 0, Math.PI * 2);
    context.fill();
  }

  drawDamageFlash(canvasWidth, canvasHeight, deltaSeconds) {
    const state = this.state;
    if (state.damageFlash <= 0) return;
    state.hudContext.fillStyle = `rgba(255,0,0,${Math.min(0.4, state.damageFlash)})`;
    state.hudContext.fillRect(0, 0, canvasWidth, canvasHeight);
    state.damageFlash -= deltaSeconds;
  }

  drawScoreboard(playerRows, canvasWidth) {
    const context = this.state.hudContext;
    const sortedPlayers = [...playerRows].sort((a, b) => b[5] - a[5]);
    context.textAlign = "right";
    context.font = "14px 'Chakra Petch', sans-serif";
    sortedPlayers.forEach(player => {
      const [playerId, x, y, angle, health, kills, deaths, name, colorIndex, dead, z, ammo, reload, cheat] = player;
      context.fillStyle = PLAYER_COLORS[colorIndex];
      context.fillText(`${name}${cheat ? " [CHEAT]" : ""}  ${kills} / ${deaths}`, canvasWidth - 12, 22 + sortedPlayers.indexOf(player) * 20);
    });
  }

  drawPlayerStatus(localPlayerRow, canvasWidth, canvasHeight) {
    if (!localPlayerRow) return;

    const state = this.state;
    const context = state.hudContext;
    const health = localPlayerRow[9] ? 0 : Math.max(0, Math.ceil(localPlayerRow[4]));
    const barX = 16;
    const barY = state.isTouch ? 44 : canvasHeight - 42;
    const barWidth = 240;
    const barHeight = 28;

    context.fillStyle = "#161a22";
    context.fillRect(barX - 3, barY - 3, barWidth + 6, barHeight + 6);
    context.fillStyle = health > 50 ? "#06d6a0" : health > 25 ? "#ffd166" : "#ff4d4d";
    context.fillRect(barX, barY, barWidth * health / 100, barHeight);
    context.strokeStyle = "#3a4558";
    context.lineWidth = 2;
    context.strokeRect(barX - 3, barY - 3, barWidth + 6, barHeight + 6);

    context.textAlign = "center";
    context.font = "bold 18px 'Chakra Petch', sans-serif";
    context.lineWidth = 4;
    context.strokeStyle = "#161a22";
    context.strokeText(`${health} / 100`, barX + barWidth / 2, barY + 20);
    context.fillStyle = "#fff";
    context.fillText(`${health} / 100`, barX + barWidth / 2, barY + 20);

    const ammo = localPlayerRow[11] ?? MAGAZINE_SIZE;
    const reloadProgress = localPlayerRow[12] || 0;
    const ammoX = state.isTouch ? canvasWidth / 2 + 110 : canvasWidth - 16;

    if (reloadProgress > 0 && !state.previousReload) state.soundManager?.playReload?.();
    state.previousReload = reloadProgress;

    context.textAlign = "right";
    context.font = "bold 34px 'Chakra Petch', sans-serif";
    context.lineWidth = 4;
    context.strokeStyle = "#161a22";
    const ammoText = `${localPlayerRow[13] ? "∞" : ammo}/${MAGAZINE_SIZE}`;
    context.strokeText(ammoText, ammoX, barY + 24);
    context.fillStyle = ammo <= 5 ? "#ff6b57" : "#fff";
    context.fillText(ammoText, ammoX, barY + 24);

    if (reloadProgress) {
      context.font = "bold 14px 'Chakra Petch', sans-serif";
      context.fillStyle = "#ffd166";
      context.fillText("RELOADING", ammoX, barY - 24);
      context.fillStyle = "#161a22";
      context.fillRect(ammoX - 200, barY - 16, 200, 8);
      context.fillStyle = "#ffd166";
      context.fillRect(ammoX - 200, barY - 16, 2 * reloadProgress, 8);
    } else if (ammo <= 5) {
      context.font = "bold 14px 'Chakra Petch', sans-serif";
      context.fillStyle = "#fff";
      context.fillText("Press R to reload", ammoX, barY - 8);
    }

    if (localPlayerRow[9]) {
      context.textAlign = "center";
      context.fillStyle = "#eef1f6";
      context.font = "bold 28px 'Chakra Petch', sans-serif";
      context.fillText("You were hit. Respawning...", canvasWidth / 2, 60);
    }
  }

  drawHostWarnings(canvasWidth) {
    const state = this.state;
    if (!state.isHost) return;

    const context = state.hudContext;
    let warningY = 64;
    context.textAlign = "left";
    context.font = "bold 14px 'Chakra Petch', sans-serif";
    context.fillStyle = "#ff6b57";

    if (state.warning && performance.now() - state.warningTime < 20000) {
      context.fillText(state.warning, 16, warningY);
      warningY += 20;
    }

    for (const [playerId, player] of Object.entries(state.players)) {
      if (playerId === state.myId) continue;
      const elapsed = performance.now() - (state.lastInputAt[playerId] || 0);
      if (elapsed > 1500) {
        context.fillText(
          `No input from ${player.name} for ${Math.round(elapsed / 1000)}s. Ask them to refresh and rejoin.`,
          16,
          warningY
        );
        warningY += 20;
      }
    }
  }

  drawMouseHelp(canvasWidth, canvasHeight) {
    const state = this.state;
    if (state.isTouch || state.paused || document.pointerLockElement === document.getElementById("c")) return;
    const context = state.hudContext;
    context.textAlign = "center";
    context.fillStyle = "#eef1f6";
    context.font = "bold 20px 'Chakra Petch', sans-serif";
    context.fillText("Click to play (Esc to release the mouse)", canvasWidth / 2, canvasHeight - 70);
  }

  draw(playerRows, localPlayerRow, canvasWidth, canvasHeight, deltaSeconds) {
    this.drawPlayerLabels(playerRows, canvasWidth, canvasHeight);
    this.drawCrosshair(canvasWidth, canvasHeight);
    this.drawDamageFlash(canvasWidth, canvasHeight, deltaSeconds);
    this.drawScoreboard(playerRows, canvasWidth);
    this.drawPlayerStatus(localPlayerRow, canvasWidth, canvasHeight);
    this.drawHostWarnings(canvasWidth);
    this.drawMouseHelp(canvasWidth, canvasHeight);
  }
}
