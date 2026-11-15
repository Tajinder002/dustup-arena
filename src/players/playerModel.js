import { PLAYER_COLORS } from "../config/gameConfig.js";
import { createWeaponModel } from "./weaponModel.js?v=city-combat-v2";

function addBlock(THREE, parent, material, width, height, depth, x, y, z) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  parent.add(mesh);
  return mesh;
}

/** A detailed classic Steve-style block character with independent limb pivots. */
export function createPlayerModel(THREE, colorIndex = 0) {
  const group = new THREE.Group();
  group.name = "DustupStevePlayer";

  const material = color => new THREE.MeshLambertMaterial({ color });
  const skin = material(0xc58b62);
  const hair = material(0x49301f);
  const shirt = material(0x2865b8);
  const shirtShadow = material(0x1d4f91);
  const pants = material(0x263d83);
  const pantsShadow = material(0x1b2d66);
  const boots = material(0x29251f);
  const eyeWhite = material(0xf3eee0);
  const eyeBlue = material(0x315eae);
  const darkBrown = material(0x38271f);
  const teamPatch = material(PLAYER_COLORS[colorIndex % PLAYER_COLORS.length]);

  // Torso and belt: classic blue shirt with small pixel-like pocket details.
  addBlock(THREE, group, shirt, 12, 18, 6, 0, 27, 0);
  addBlock(THREE, group, shirtShadow, 12.1, 2.2, 6.1, 0, 18.5, 0);
  addBlock(THREE, group, shirtShadow, 4.2, 2.8, 0.55, 3.3, 29.5, 3.2);
  addBlock(THREE, group, shirtShadow, 0.8, 3.1, 0.6, 2.2, 29.6, 3.55);
  addBlock(THREE, group, teamPatch, 2.2, 2.2, 0.45, -3.8, 28.5, 3.24);

  // Square head with brown hair cap, side hair, eyebrows, eyes, nose and mouth.
  const head = new THREE.Group();
  head.name = "SteveHead";
  head.position.set(0, 36, 0);
  group.add(head);
  addBlock(THREE, head, skin, 12, 12, 12, 0, 6, 0);
  addBlock(THREE, head, hair, 12.25, 2.1, 12.25, 0, 11, 0);
  addBlock(THREE, head, hair, 12.25, 10, 1.5, 0, 5.2, -5.25);
  addBlock(THREE, head, hair, 1.5, 8, 10, -5.25, 7, -1.1);
  addBlock(THREE, head, hair, 1.5, 8, 10, 5.25, 7, -1.1);
  addBlock(THREE, head, darkBrown, 3.4, 1.1, 0.45, 0, 8.8, 6.22);

  for (const side of [-1, 1]) {
    addBlock(THREE, head, eyeWhite, 2.2, 1.8, 0.45, side * 2.65, 6.5, 6.22);
    addBlock(THREE, head, eyeBlue, 1, 1.35, 0.25, side * 2.38, 6.45, 6.58);
  }
  addBlock(THREE, head, skin, 2.2, 2.2, 1.5, 0, 4.3, 6.35);
  addBlock(THREE, head, darkBrown, 2.2, 1.1, 0.5, 0, 2.2, 6.24);
  addBlock(THREE, head, darkBrown, 1.8, 1.1, 0.5, -2.1, 2.2, 6.24);
  addBlock(THREE, head, darkBrown, 1.8, 1.1, 0.5, 2.1, 2.2, 6.24);

  // Square legs and boots, each pivoted at the hip for walking/running.
  const legs = [];
  for (const side of [-1, 1]) {
    const leg = new THREE.Group();
    leg.name = side < 0 ? "SteveLeftLeg" : "SteveRightLeg";
    leg.position.set(side * 3, 18, 0);
    group.add(leg);
    addBlock(THREE, leg, pants, 6, 18, 6, 0, -9, 0);
    addBlock(THREE, leg, pantsShadow, 6.1, 2.2, 6.1, 0, -16.5, 0);
    addBlock(THREE, leg, boots, 6.2, 3.2, 6.5, 0, -18, 0.2);
    legs.push(leg);
  }

  // Sleeves and square forearms are attached to shoulder pivots.
  const arms = [];
  let rightHand = null;
  for (const side of [-1, 1]) {
    const arm = new THREE.Group();
    arm.name = side < 0 ? "SteveLeftArm" : "SteveRightArm";
    arm.position.set(side * 9, 35, 0);
    arm.rotation.x = -0.96;
    arm.rotation.z = side < 0 ? 0.62 : 0;
    group.add(arm);
    addBlock(THREE, arm, shirt, 6, 8, 6, 0, -4, 0);
    addBlock(THREE, arm, skin, 6, 10, 6, 0, -13, 0);

    if (side < 0) {
      addBlock(THREE, arm, skin, 6, 4, 6, 0, -20, 0);
    } else {
      rightHand = new THREE.Group();
      rightHand.name = "SteveRightHand";
      rightHand.position.set(0, -20, 0);
      arm.add(rightHand);
      addBlock(THREE, rightHand, skin, 6, 4, 6, 0, 0, 0);
    }
    arms.push(arm);
  }

  // Mount the rifle on Steve's right hand. The local +90 degree rotation
  // cancels the raised forearm angle so the barrel points forward (+Z).
  const weapon = createWeaponModel(THREE, 0.55);
  weapon.position.set(-2.8, -0.5, 5.2);
  weapon.rotation.set(0.96, 0, 0);
  weapon.userData.baseRotationX = weapon.rotation.x;
  rightHand.add(weapon);

  group.userData = {
    isFallback: true,
    isSteve: true,
    colorIndex,
    head,
    headBaseY: 36,
    legs,
    arms,
    armBaseX: [-0.96, -0.96],
    weapon,
    materials: [skin, hair, shirt, shirtShadow, pants, pantsShadow, boots, eyeWhite, eyeBlue, darkBrown, teamPatch],
    phase: 0,
    movementAmount: 0,
    motionSpeed: 0,
    isMoving: false,
    isRunning: false,
    reverseDirection: false,
    activeReverse: false,
    bodyAngle: null,
    moveAngle: null,
    lastX: null,
    lastY: 0,
    deathVisibleTime: 0,
    wasDead: false,
    currentAnimation: "idle",
    mixer: null,
    actions: {},
    activeAction: null,
    hitMaterial: shirt
  };
  return group;
}
