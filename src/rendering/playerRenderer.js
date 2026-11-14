import { createPlayerModel, createLoadedPlayerModel } from "../players/playerModel.js";
import { ASSET_MANIFEST } from "../assets/assetManifest.js";

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
    if (!this.assetLoader?.available) {
      this.logger("GLTFLoader unavailable. Using the generated human character model.");
      return false;
    }
    if (this.characterLoad) return this.characterLoad;

    this.characterLoad = this.assetLoader.loadFirstAvailable(
      [ASSET_MANIFEST.character.local, ASSET_MANIFEST.character.remote],
      ASSET_MANIFEST.character.label
    ).then(gltf => {
      this.characterTemplate = gltf.scene;
      this.characterAnimations = gltf.animations || [];
      this.characterReady = true;
      this.logger(`Rigged character ready (${this.characterAnimations.length} animation clips).`);
      return true;
    }).catch(error => {
      this.logger(`Rigged character unavailable; using generated human fallback: ${error.message}`);
      return false;
    });
    return this.characterLoad;
  }

  createModel(colorIndex) {
    if (this.characterReady && this.characterTemplate) {
      return createLoadedPlayerModel(
        this.THREE,
        this.assetLoader,
        this.characterTemplate,
        this.characterAnimations,
        colorIndex
      );
    }
    const fallback = createPlayerModel(this.THREE, colorIndex);
    fallback.userData.colorIndex = colorIndex;
    return fallback;
  }

  replaceWithRiggedModel(playerId, colorIndex) {
    const state = this.state;
    const previous = state.playerMeshes[playerId];
    const model = this.createModel(colorIndex);
    model.position.copy(previous.position);
    model.rotation.copy(previous.rotation);
    model.visible = previous.visible;
    state.scene.remove(previous);
    state.scene.add(model);
    state.playerMeshes[playerId] = model;
    return model;
  }

  getDesiredAnimation(model, row, movementDistance, deltaSeconds) {
    const animation = model.userData;
    const dead = Boolean(row[9]);
    const verticalOffset = row[10] || 0;
    const ammo = row[11] ?? 30;
    const reloadProgress = row[12] || 0;
    const speed = deltaSeconds > 0 ? movementDistance / deltaSeconds : 0;

    if (dead) return "death";
    if (verticalOffset > 1) return "jump";
    if (reloadProgress > 0) return "reload";
    if (animation.previousAmmo !== undefined && ammo < animation.previousAmmo) {
      animation.shootTime = 0.14;
    }
    animation.previousAmmo = ammo;
    if (animation.shootTime > 0) {
      animation.shootTime = Math.max(0, animation.shootTime - deltaSeconds);
      return "shoot";
    }
    if (movementDistance > 0.5) return speed > 250 ? "run" : "walk";
    return "idle";
  }

  updateAnimation(model, desired, deltaSeconds, movementDistance) {
    const data = model.userData;
    data.currentAnimation = desired;
    if (data.mixer) {
      const actions = data.actions || {};
      let next = actions[desired] || null;
      if (!next && (desired === "run" || desired === "jump")) next = actions.walk || null;
      if (!next && (desired === "shoot" || desired === "reload")) next = actions.idle || null;
      if (next !== data.activeAction) {
        if (data.activeAction) data.activeAction.fadeOut(0.12);
        if (next) {
          next.reset();
          next.enabled = true;
          next.setEffectiveWeight(1);
          next.setEffectiveTimeScale(desired === "run" ? 1.25 : 1);
          next.setLoop(desired === "death" ? this.THREE.LoopOnce : this.THREE.LoopRepeat, desired === "death" ? 1 : Infinity);
          next.clampWhenFinished = desired === "death";
          next.fadeIn(0.14).play();
        }
        data.activeAction = next;
      }
      data.mixer.update(deltaSeconds);
    }

    const phase = performance.now() * (desired === "run" ? 0.018 : 0.012);
    const moving = desired === "walk" || desired === "run";
    const amplitude = moving ? (desired === "run" ? 0.72 : 0.43) : 0;
    const procedural = data.proceduralBones || {};
    if (data.isFallback) {
      data.phase += Math.min(movementDistance, 40) * 0.075;
      data.movementAmount += (amplitude - data.movementAmount) * Math.min(1, deltaSeconds * 9);
      const swing = Math.sin(data.phase) * data.movementAmount;
      data.legs[0].rotation.x = swing;
      data.legs[1].rotation.x = -swing;
      data.arms[0].rotation.x = -swing * 0.4;
      data.arms[1].rotation.x = swing * 0.2;
      if (desired === "reload") data.arms[1].rotation.x = -0.72;
      else if (desired === "shoot") data.arms[1].rotation.x = -0.2;
      else data.arms[1].rotation.x *= 0.82;
    } else {
      const walkSwing = moving ? Math.sin(phase) * amplitude : 0;
      if (procedural.leftUpperLeg) procedural.leftUpperLeg.rotation.x = walkSwing;
      if (procedural.rightUpperLeg) procedural.rightUpperLeg.rotation.x = -walkSwing;
      if (procedural.leftUpperArm) procedural.leftUpperArm.rotation.x = -walkSwing * 0.65;
      if (procedural.rightUpperArm) {
        const target = desired === "reload" ? -0.72 : desired === "shoot" ? -0.38 : -walkSwing * 0.55;
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
      } else if (this.characterReady && model.userData.isFallback) {
        model = this.replaceWithRiggedModel(playerId, colorIndex);
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
      const movementDistance = data.lastX === null ? 0 : Math.hypot(x - data.lastX, y - data.lastY);
      data.lastX = x;
      data.lastY = y;
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

      const desired = this.getDesiredAnimation(model, row, movementDistance, deltaSeconds);
      this.updateAnimation(model, desired, deltaSeconds, movementDistance);

      model.position.set(x, z || 0, y);
      model.rotation.y = -angle;
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
