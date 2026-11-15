import { createWeaponModel } from "./weaponModel.js?v=steve-character-v1";

function addSteveBlock(THREE, parent, material, width, height, depth, x, y, z) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  parent.add(mesh);
  return mesh;
}

/**
 * Classic blocky Steve-style player. All dimensions use the game's 48-unit
 * player scale. Separate arm and leg pivots keep the existing run animation
 * controller working without a downloaded model or external textures.
 */
export function createPlayerModel(THREE, colorIndex = 0) {
  const group = new THREE.Group();
  group.name = "DustupStevePlayer";

  const material = (color, extra = {}) => new THREE.MeshLambertMaterial({ color, ...extra });
  const skin = material(0xc58b62);
  const hair = material(0x49301f);
  const shirt = material(0x2865b8);
  const shirtDark = material(0x204f91);
  const pants = material(0x263d83);
  const boots = material(0x29251f);
  const eyeWhite = material(0xf3eee0);
  const eyeBlue = material(0x315eae);
  const mouth = material(0x70452f);

  // Torso: bright blue shirt, with a simple collar block.
  addSteveBlock(THREE, group, shirt, 12, 18, 6, 0, 27, 0);
  addSteveBlock(THREE, group, shirtDark, 5, 2, 0.35, 0, 34.5, 3.18);

  // Head: 12-unit cube, with the classic brown hair cap and side/back hair.
  const head = new THREE.Group();
  head.name = "SteveHead";
  head.position.set(0, 36, 0);
  group.add(head);
  addSteveBlock(THREE, head, skin, 12, 12, 12, 0, 6, 0);
  addSteveBlock(THREE, head, hair, 12.2, 2, 12.2, 0, 11, 0);
  addSteveBlock(THREE, head, hair, 12.2, 12, 1.8, 0, 6, -5.1);
  addSteveBlock(THREE, head, hair, 2, 10, 7, -5.1, 5.5, -2.4);
  addSteveBlock(THREE, head, hair, 2, 10, 7, 5.1, 5.5, -2.4);

  // Square face details on the +Z/front side.
  for (const side of [-1, 1]) {
    addSteveBlock(THREE, head, eyeWhite, 2.1, 1.7, 0.45, side * 2.65, 6.9, 6.22);
    addSteveBlock(THREE, head, eyeBlue, 0.9, 1.25, 0.25, side * 2.45, 6.85, 6.58);
  }
  addSteveBlock(THREE, head, skin, 2.2, 2.6, 1.2, 0, 4.2, 6.35);
  addSteveBlock(THREE, head, mouth, 5.4, 1.4, 0.4, 0, 1.1, 6.22);

  // Legs use pivot groups so the existing alternating run cycle remains valid.
  const legs = [];
  for (const side of [-1, 1]) {
    const leg = new THREE.Group();
    leg.name = side < 0 ? "SteveLeftLeg" : "SteveRightLeg";
    leg.position.set(side * 3, 18, 0);
    group.add(leg);
    addSteveBlock(THREE, leg, pants, 6, 18, 6, 0, -9, 0);
    addSteveBlock(THREE, leg, boots, 6.1, 3, 6.2, 0, -16.5, 0.25);
    legs.push(leg);
  }

  // Arms: blue short sleeves above square skin-coloured forearms.
  const arms = [];
  for (const side of [-1, 1]) {
    const arm = new THREE.Group();
    arm.name = side < 0 ? "SteveLeftArm" : "SteveRightArm";
    arm.position.set(side * 9, 35, 0);
    group.add(arm);
    addSteveBlock(THREE, arm, shirt, 6, 8, 6, 0, -4, 0);
    addSteveBlock(THREE, arm, skin, 6, 10, 6, 0, -13, 0);
    arms.push(arm);
  }

  // Keep the current rifle and recoil/muzzle-flash hooks, but use a simple
  // compact scale and place it across the front of Steve's torso.
  const weapon = createWeaponModel(THREE, 0.42);
  weapon.position.set(4.8, 27.5, 6.2);
  weapon.rotation.set(0, 0, 0);
  weapon.userData.baseRotationX = weapon.rotation.x;
  group.add(weapon);

  group.userData = {
    isFallback: true,
    isSteve: true,
    colorIndex,
    head,
    legs,
    arms,
    weapon,
    materials: [skin, hair, shirt, shirtDark, pants, boots, eyeWhite, eyeBlue, mouth],
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

