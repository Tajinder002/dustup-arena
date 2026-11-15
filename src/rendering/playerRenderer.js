import { createPlayerModel } from "../players/playerModel.js?v=color-refresh-v2";

function wrapAngle(angle) {
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

export class PlayerRenderer {
  constructor(state, THREE, soundManager, assetLoader, logger = () => {}) {
    this.state = state;
    this.THREE = THREE;
    this.soundManager = soundManager;
    this.assetLoader = assetLoader;
    this.logger = logger;
    this.characterTemplate = null;
    this.characterAnimations = [];
    this.characterReady = false;
    this.characterLoad = null;
  }

  async initialize() {
    // Steve is generated locally from simple cuboids; don't fetch the old
    // 14 MB cyborg model or wait for its animations before entering a match.
    this.characterReady = false;
    this.characterTemplate = null;
    this.characterAnimations = [];
    this.logger("Classic Steve player model ready.");
    return true;
  }

  createModel(colorIndex) {
    const model = createPlayerModel(this.THREE, colorIndex);
    model.userData.colorIndex = colorIndex;
    return model;
  }

  getDesiredAnimation(model, row, deltaSeconds) {
    const animation = model.userData;
    const dead = Boolean(row[9]);
    const verticalOffset = row[10] || 0;
    const ammo = row[11] ?? 30;
    const reloadProgress = row[12] || 0;

    // Shooting and reloading are overlays, not full-body locomotion states.
    // This GLB only contains walk/run clips. Switching to a nonexistent
    // shoot/reload clip fades out the gait and leaves the rig in bind pose.
    // Keep those actions independent so sprinting/jumping continues while firing.
    if (animation.previousAmmo !== undefined && ammo < animation.previousAmmo) {
      animation.shotPulse = 0.14;
    }
    animation.previousAmmo = ammo;
    animation.isReloading = reloadProgress > 0;
    animation.shotPulse = Math.max(0, (animation.shotPulse || 0) - deltaSeconds);
    animation.isShooting = animation.shotPulse > 0;

    // Hysteresis stabilizes locomotion state across interpolated network frames.
    animation.isMoving = animation.isMoving
      ? animation.motionSpeed > 12
      : animation.motionSpeed > 22;
    animation.isRunning = animation.isRunning
      ? animation.motionSpeed > 175
      : animation.motionSpeed > 210;

    if (dead) return "death";
    if (verticalOffset > 1) return "jump";
    if (animation.isMoving) return animation.isRunning ? "run" : "walk";
    return "idle";
  }

  updateAnimation(model, desired, deltaSeconds, torsoAimOffset) {
    const data = model.userData;
    data.currentAnimation = desired;

    // Undo last frame's additive torso twist before the mixer writes its next
    // walk/run pose; this keeps the offset from accumulating every render.
    const twistBones = data.aimTwistBones || [];
    const axis = data.twistAxis || (data.twistAxis = new this.THREE.Vector3(0, 1, 0));
    for (const entry of twistBones) {
      if (!entry.appliedAngle) continue;
      entry.tempQuaternion.setFromAxisAngle(axis, -entry.appliedAngle);
      entry.bone.quaternion.multiply(entry.tempQuaternion);
      entry.appliedAngle = 0;
    }

    if (data.mixer) {
      const actions = data.actions || {};
      let next = actions[desired] || null;
      if (!next && desired === "run") next = actions.walk || null;
      if (!next && desired === "jump") next = actions.walk || null;
      // No shoot/reload action exists in this asset. Preserve the current
      // locomotion clip instead of fading it out when the trigger is pressed.

      const reverse = (desired === "walk" || desired === "run") && data.reverseDirection;
      if (next !== data.activeAction || reverse !== data.activeReverse) {
        if (data.activeAction) data.activeAction.fadeOut(0.12);
        if (next) {
          next.reset();
          next.enabled = true;
          next.setEffectiveWeight(1);
          const speedScale = desired === "run"
            ? clamp(data.motionSpeed / 260, 1, 1.35)
            : clamp(data.motionSpeed / 135, 0.72, 1.2);
          next.setLoop(this.THREE.LoopRepeat, Infinity);
          next.clampWhenFinished = false;
          // The supplied GLB has forward locomotion clips only. Reverse the
          // same gait for backpedaling without turning the rifle away from aim.
          next.time = reverse ? next.getClip().duration : 0;
          next.setEffectiveTimeScale(reverse ? -speedScale : speedScale);
          next.fadeIn(0.14).play();
        }
        data.activeAction = next;
        data.activeReverse = reverse;
      }
      data.mixer.update(deltaSeconds);
    }

    // Turn the upper torso back toward the aim/camera yaw while the lower body
    // follows travel direction, creating a controllable third-person strafe.
    for (const entry of twistBones) {
      const applied = torsoAimOffset * entry.weight;
      if (!applied) continue;
      entry.tempQuaternion.setFromAxisAngle(axis, applied);
      entry.bone.quaternion.multiply(entry.tempQuaternion);
      entry.appliedAngle = applied;
    }

    const moving = desired === "walk" || desired === "run";
    const amplitude = moving ? (desired === "run" ? 0.72 : 0.43) : 0;
    if (data.isFallback) {
      data.phase += Math.max(0, data.motionSpeed) * deltaSeconds * 0.075;
      data.movementAmount += (amplitude - data.movementAmount) * Math.min(1, deltaSeconds * 9);
      const swing = Math.sin(data.phase) * data.movementAmount;
      data.legs[0].rotation.x = swing;
      data.legs[1].rotation.x = -swing;

      // Steve holds a raised rifle-ready pose while the arms subtly counter-swing.
      const armBaseX = data.armBaseX || [0, 0];
      data.arms[0].rotation.x = armBaseX[0] - swing * 0.22;
      data.arms[1].rotation.x = armBaseX[1] + swing * 0.14;
      if (data.head) {
        data.head.position.y = data.headBaseY
          + Math.abs(Math.sin(data.phase * 2)) * data.movementAmount * 0.65;
      }
    } else if (!data.activeAction) {
      const procedural = data.proceduralBones || {};
      if (procedural.rightUpperArm) {
        const target = desired === "reload" ? -0.72 : desired === "shoot" ? -0.38 : 0;
        procedural.rightUpperArm.rotation.x += (target - procedural.rightUpperArm.rotation.x) * Math.min(1, deltaSeconds * 10);
      }
      if (procedural.spine && desired === "jump") {
        procedural.spine.rotation.x += (-0.12 - procedural.spine.rotation.x) * Math.min(1, deltaSeconds * 5);
      }
    }

    if (desired === "death") {
      model.rotation.x += (Math.PI / 2 - model.rotation.x) * Math.min(1, deltaSeconds * 6);
    } else {
      model.rotation.x += (0 - model.rotation.x) * Math.min(1, deltaSeconds * 9);
    }

    const weapon = data.weapon;
    if (weapon) {
      weapon.userData.recoil = Math.max(0, (weapon.userData.recoil || 0) - deltaSeconds * 5.5);
      weapon.rotation.x = (weapon.userData.baseRotationX || 0) - (weapon.userData.recoil || 0) * 0.12;
      const flashTime = weapon.userData.flashTime || 0;
      weapon.userData.flashTime = Math.max(0, flashTime - deltaSeconds);
      if (weapon.userData.muzzleFlash) {
        weapon.userData.muzzleFlash.visible = weapon.userData.flashTime > 0;
        weapon.userData.muzzleFlash.scale.setScalar(0.65 + Math.random() * 0.5);
      }
    }
  }

  update(playerRows, deltaSeconds) {
    const state = this.state;
    const visiblePlayers = {};

    for (const row of playerRows) {
      const [playerId, x, y, angle, health, kills, deaths, name, colorIndex, dead, z] = row;
      visiblePlayers[playerId] = true;
      let model = state.playerMeshes[playerId];
      if (!model) {
        model = this.createModel(colorIndex);
        state.playerMeshes[playerId] = model;
        state.scene.add(model);
      }

      if (state.previousHealth[playerId] !== undefined && health < state.previousHealth[playerId]) {
        state.hitTimers[playerId] = 0.25;
        if (playerId === state.myId) {
          state.damageFlash = 0.45;
          this.soundManager.playHurt();
        }
      }
      state.previousHealth[playerId] = health;
      if (state.hitTimers[playerId] > 0) state.hitTimers[playerId] -= deltaSeconds;

      const data = model.userData;
      const deltaX = data.lastX === null ? 0 : x - data.lastX;
      const deltaY = data.lastX === null ? 0 : y - data.lastY;
      const movementDistance = Math.hypot(deltaX, deltaY);
      const instantSpeed = deltaSeconds > 0 ? movementDistance / deltaSeconds : 0;
      const speedResponse = 1 - Math.exp(-deltaSeconds * 12);
      data.motionSpeed += (instantSpeed - data.motionSpeed) * speedResponse;
      data.lastX = x;
      data.lastY = y;
      if (movementDistance > 0.001) data.moveAngle = Math.atan2(deltaY, deltaX);
      const previousAmmo = data.previousAmmo;
      if (previousAmmo !== undefined && row[11] < previousAmmo && data.weapon) {
        data.weapon.userData.recoil = 1;
        data.weapon.userData.flashTime = 0.075;
      }
      const isDead = Boolean(dead);
      if (isDead && !data.wasDead) data.deathVisibleTime = 0.55;
      data.wasDead = isDead;
      if (isDead) data.deathVisibleTime = Math.max(0, data.deathVisibleTime - deltaSeconds);
      else data.deathVisibleTime = 0;

      const desired = this.getDesiredAnimation(model, row, deltaSeconds);
      const moving = data.isMoving;
      const moveAngle = moving && data.moveAngle !== null && data.moveAngle !== undefined
        ? data.moveAngle
        : angle;
      const movementOffset = wrapAngle(moveAngle - angle);
      const backpedaling = moving && Math.abs(movementOffset) > 2.15;
      data.reverseDirection = backpedaling;

      // The body turns partway into a strafe. The spine chain counters the
      // turn so the hands/rifle remain oriented toward the player's aim yaw.
      const bodyTarget = !moving || backpedaling
        ? angle
        : angle + clamp(movementOffset, -0.72, 0.72);
      if (data.bodyAngle === null || data.bodyAngle === undefined) data.bodyAngle = bodyTarget;
      data.bodyAngle += wrapAngle(bodyTarget - data.bodyAngle) * Math.min(1, deltaSeconds * 11);
      const torsoAimOffset = clamp(wrapAngle(angle - data.bodyAngle), -0.78, 0.78);

      this.updateAnimation(model, desired, deltaSeconds, torsoAimOffset);

      model.position.set(x, z || 0, y);
      model.rotation.y = Math.PI / 2 - data.bodyAngle;
      model.visible = !isDead || data.deathVisibleTime > 0;

      model.traverse(object => {
        if (!object.isMesh) return;
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach(material => {
          if (!material?.emissive) return;
          if (state.hitTimers[playerId] > 0) {
            material.emissive.setHex(0x8c1616);
            material.emissiveIntensity = 0.38;
          } else {
            material.emissive.setHex(0x000000);
            material.emissiveIntensity = 0;
          }
        });
      });
    }

    for (const playerId of Object.keys(state.playerMeshes)) {
      if (!visiblePlayers[playerId]) {
        state.scene.remove(state.playerMeshes[playerId]);
        delete state.playerMeshes[playerId];
        delete state.previousHealth[playerId];
        delete state.hitTimers[playerId];
      }
    }
  }

  updateBullets(bulletRows) {
    const state = this.state;
    while (state.bulletMeshes.length < bulletRows.length) {
      const bulletMesh = new this.THREE.Mesh(state.bulletGeometry, state.bulletMaterial);
      state.scene.add(bulletMesh);
      state.bulletMeshes.push(bulletMesh);
    }

    state.bulletMeshes.forEach((mesh, index) => {
      const bullet = bulletRows[index];
      mesh.visible = !!bullet;
      if (bullet) mesh.position.set(bullet[0], bullet[2], bullet[1]);
    });
  }
}
