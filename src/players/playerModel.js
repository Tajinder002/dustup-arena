import { PLAYER_COLORS } from "../config/gameConfig.js?v=pubg-aim-v1";
import { createWeaponModel } from "./weaponModel.js?v=pubg-aim-v1";

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
  const hairHighlight = material(0x765034);
  const shirt = material(0x245da5);
  const shirtShadow = material(0x173c70);
  const armor = material(0x982c37);
  const armorEdge = material(0xe95a63);
  const strap = material(0x24252b);
  const brass = material(0xc6a05b);
  const pants = material(0x263b56);
  const pantsShadow = material(0x17283e);
  const boots = material(0x20252d);
  const gloves = material(0x2c333d);
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

  // Low-profile tactical vest, shoulder plates and chest harness.
  addBlock(THREE, group, armor, 7.4, 9.2, 0.9, 0, 29, 3.42);
  addBlock(THREE, group, armorEdge, 5.2, 1.1, 0.45, 0, 33.2, 3.95);
  addBlock(THREE, group, armorEdge, 4.6, 5.4, 0.32, 0, 28.2, 4.02);
  addBlock(THREE, group, brass, 1.4, 1.4, 0.28, 0, 28.2, 4.22);
  addBlock(THREE, group, armorEdge, 1.1, 2.7, 0.25, -5.1, 29.3, 3.9);
  addBlock(THREE, group, armorEdge, 1.1, 2.7, 0.25, 5.1, 29.3, 3.9);
  addBlock(THREE, group, strap, 2, 12.5, 0.75, -3.4, 27.2, 3.8);
  addBlock(THREE, group, brass, 2.1, 2.1, 0.55, -3.4, 25.5, 4.24);
  addBlock(THREE, group, shirtShadow, 12.3, 2.2, 6.25, 0, 18.3, 0);
  addBlock(THREE, group, brass, 2.2, 2.2, 0.55, 0, 18.3, 3.35);
  addBlock(THREE, group, armor, 3.1, 4, 1.2, -7.2, 22, 1.4);
  addBlock(THREE, group, armorEdge, 3.2, 1, 1.25, -7.2, 24.1, 1.4);

  // Square head with brown hair cap, side hair, eyebrows, eyes, nose and mouth.
  const head = new THREE.Group();
  head.name = "SteveHead";
  head.position.set(0, 36, 0);
  group.add(head);
  addBlock(THREE, head, skin, 12, 12, 12, 0, 6, 0);
  addBlock(THREE, head, hair, 12.25, 2.1, 12.25, 0, 11, 0);
  addBlock(THREE, head, hairHighlight, 7.5, 0.55, 2.2, 0, 11.95, 1.3);
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
    addBlock(THREE, leg, armor, 6.2, 3.8, 0.85, 0, -8.8, 3.35);
    addBlock(THREE, leg, armorEdge, 4.2, 0.65, 0.35, 0, -10.2, 3.85);
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
    addBlock(THREE, arm, armor, 6.25, 3.2, 6.25, 0, -3, 0);
    addBlock(THREE, arm, armorEdge, 6.3, 0.7, 6.3, 0, -5, 0);
    addBlock(THREE, arm, skin, 6, 10, 6, 0, -13, 0);
    addBlock(THREE, arm, gloves, 6.15, 2, 6.15, 0, -16.5, 0);

    if (side < 0) {
      addBlock(THREE, arm, gloves, 6, 4, 6, 0, -20, 0);
    } else {
      rightHand = new THREE.Group();
      rightHand.name = "SteveRightHand";
      rightHand.position.set(0, -20, 0);
      arm.add(rightHand);
      addBlock(THREE, rightHand, gloves, 6, 4, 6, 0, 0, 0);
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
    materials: [skin, hair, hairHighlight, shirt, shirtShadow, armor, armorEdge, strap, brass, pants, pantsShadow, boots, gloves, eyeWhite, eyeBlue, darkBrown, teamPatch],
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
