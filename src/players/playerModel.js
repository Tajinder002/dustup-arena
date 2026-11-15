import { PLAYER_COLORS } from "../config/gameConfig.js";
import { createWeaponModel } from "./weaponModel.js";

function sphere(THREE, group, material, position, scale, detail = 14) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, detail, Math.max(8, detail - 2)), material);
  mesh.position.set(...position);
  mesh.scale.set(...scale);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

function segment(THREE, parent, material, radiusTop, radiusBottom, length, y) {
  const joint = new THREE.Group();
  joint.position.y = y;
  parent.add(joint);
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radiusTop, radiusBottom, length, 12, 1),
    material
  );
  mesh.position.y = -length / 2;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  joint.add(mesh);
  return joint;
}

/** Organic-shape fallback used when a downloaded rigged GLB is unavailable. */
export function createPlayerModel(THREE, colorIndex = 0) {
  const group = new THREE.Group();
  group.name = "DustupProceduralHumanFallback";
  const teamColor = new THREE.Color(PLAYER_COLORS[colorIndex % PLAYER_COLORS.length]);
  const jacket = new THREE.MeshStandardMaterial({ color: teamColor, roughness: 0.82 });
  const darkFabric = new THREE.MeshStandardMaterial({ color: 0x252b31, roughness: 0.9 });
  const pants = new THREE.MeshStandardMaterial({ color: 0x303a46, roughness: 0.9 });
  const skin = new THREE.MeshStandardMaterial({ color: 0xb9876c, roughness: 0.88 });
  const hair = new THREE.MeshStandardMaterial({ color: 0x2a211b, roughness: 0.95 });
  const boot = new THREE.MeshStandardMaterial({ color: 0x151719, roughness: 0.96 });
  const eye = new THREE.MeshStandardMaterial({ color: 0x17191b, roughness: 0.48 });
  const metallic = new THREE.MeshStandardMaterial({ color: 0x69747b, metalness: 0.84, roughness: 0.3 });

  // Pelvis, torso, collar and head use rounded meshes rather than voxel blocks.
  sphere(THREE, group, pants, [0, 17, 0], [5.8, 5.2, 4.4]);
  sphere(THREE, group, jacket, [0, 26, 0], [6.4, 9.4, 4.5]);
  sphere(THREE, group, jacket, [0, 31, 0.2], [6.7, 5.4, 4.6]);
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(2.3, 2.7, 3.2, 12), darkFabric);
  collar.position.y = 35.4;
  collar.castShadow = true;
  group.add(collar);
  sphere(THREE, group, skin, [0, 41, 0], [4.1, 5.2, 3.8]);
  sphere(THREE, group, hair, [0, 44.3, -0.55], [4.2, 2.3, 3.9]);
  sphere(THREE, group, skin, [0, 40.4, 3.25], [2.4, 2.8, 0.7]);
  sphere(THREE, group, eye, [-1.25, 41.4, 3.6], [0.37, 0.45, 0.22], 10);
  sphere(THREE, group, eye, [1.25, 41.4, 3.6], [0.37, 0.45, 0.22], 10);
  sphere(THREE, group, skin, [0, 39.6, 3.8], [0.55, 0.9, 0.65], 10);

  const legs = [];
  for (const side of [-1, 1]) {
    const hip = new THREE.Group();
    hip.position.set(side * 3, 15.5, 0);
    group.add(hip);
    segment(THREE, hip, pants, 2.8, 3.2, 9, 0);
    const knee = new THREE.Group();
    knee.position.y = -9;
    hip.add(knee);
    sphere(THREE, knee, pants, [0, 0, 0], [2.25, 2.2, 2.4]);
    const shin = segment(THREE, knee, pants, 2.15, 2.45, 8.2, -0.6);
    const foot = sphere(THREE, shin, boot, [0, -8.7, 1.25], [2.55, 1.55, 4.2]);
    foot.position.z = 1.25;
    legs.push(hip);
  }

  const arms = [];
  for (const side of [-1, 1]) {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 6.3, 31, 0);
    group.add(shoulder);
    sphere(THREE, shoulder, jacket, [0, -1.5, 0], [2.6, 3.2, 2.7]);
    segment(THREE, shoulder, jacket, 2.0, 2.35, 7.3, -3);
    const elbow = new THREE.Group();
    elbow.position.y = -10.2;
    shoulder.add(elbow);
    sphere(THREE, elbow, skin, [0, 0, 0], [1.9, 1.8, 2]);
    segment(THREE, elbow, jacket, 1.65, 1.9, 7.1, -0.4);
    sphere(THREE, elbow, skin, [0, -7.8, 0.4], [1.6, 1.7, 1.7]);
    arms.push(shoulder);
  }

  // Shoulder straps and chest plate add detail to the fallback silhouette.
  const chestPlate = new THREE.Mesh(new THREE.BoxGeometry(6.2, 6, 1.4), darkFabric);
  chestPlate.position.set(0, 27.5, 4.2);
  chestPlate.castShadow = true;
  group.add(chestPlate);
  for (const x of [-2.2, 0, 2.2]) {
    const pouch = new THREE.Mesh(new THREE.BoxGeometry(1.7, 2.2, 1.2), metallic);
    pouch.position.set(x, 24, 4.8);
    group.add(pouch);
  }

  const weapon = createWeaponModel(THREE, 1);
  weapon.position.set(7.5, 25.5, 7);
  weapon.rotation.x = -0.03;
  weapon.userData.baseRotationX = weapon.rotation.x;
  group.add(weapon);

  group.userData = {
    isFallback: true,
    legs,
    arms,
    weapon,
    materials: [jacket, darkFabric, pants, skin, hair, boot, eye, metallic],
    phase: 0,
    movementAmount: 0,
    lastX: null,
    lastY: 0,
    deathVisibleTime: 0,
    wasDead: false,
    currentAnimation: "idle",
    mixer: null,
    actions: {},
    activeAction: null,
    hitMaterial: jacket
  };
  return group;
}

export function createLoadedPlayerModel(THREE, assetLoader, template, animations, colorIndex = 0) {
  const wrapper = new THREE.Group();
  wrapper.name = "DustupRiggedPlayer";
  const avatar = assetLoader.cloneScene(template);
  avatar.traverse(object => {
    if (!object.isMesh) return;
    // Skinned player meshes can be expensive to include in the city shadow map.
    // Keep the character visually lit but exclude it from shadow-map passes.
    object.castShadow = false;
    object.receiveShadow = false;
    if (Array.isArray(object.material)) object.material = object.material.map(material => material.clone());
    else if (object.material) object.material = object.material.clone();
  });

  // The cyborg mesh accessor bounds describe the unskinned bind geometry,
  // which is only about 1.8 cm tall because its Armature node carries a 0.01
  // scale. Measuring that box makes the avatar ~100x too large once skinning
  // applies the full bone transforms. Measure the actual world-space rig joints.
  avatar.updateMatrixWorld(true);
  const rigBounds = new THREE.Box3();
  const bonePosition = new THREE.Vector3();
  let boneCount = 0;
  avatar.traverse(object => {
    if (!object.isBone) return;
    object.getWorldPosition(bonePosition);
    rigBounds.expandByPoint(bonePosition);
    boneCount += 1;
  });

  const bounds = new THREE.Box3().setFromObject(avatar);
  const geometrySize = new THREE.Vector3();
  const center = new THREE.Vector3();
  bounds.getSize(geometrySize);
  bounds.getCenter(center);
  const measuredHeight = boneCount >= 2
    ? rigBounds.max.y - rigBounds.min.y
    : geometrySize.y;
  const targetHeight = 48;
  const scale = targetHeight / Math.max(measuredHeight, 0.1);
  avatar.scale.setScalar(scale);
  // The original GLB's feet already sit at local Y=0; use its mesh-space
  // origin for ground alignment while taking scale from the articulated rig.
  avatar.position.set(-center.x * scale, -bounds.min.y * scale, -center.z * scale);
  avatar.updateMatrixWorld(true);
  wrapper.add(avatar);

  // Add a compact weapon to a right-hand bone when the source rig exposes one.
  const bones = [];
  avatar.traverse(object => {
    if (object.isBone) bones.push(object);
  });
  const normalizedBoneName = bone => bone.name.toLowerCase().replace(/[^a-z0-9]/g, "").replace(/^mixamorig/, "");
  const findBone = (...patterns) => bones.find(bone => {
    const name = normalizedBoneName(bone);
    return patterns.some(pattern => pattern.test(name));
  });
  const hand = findBone(/righthand/, /handright/, /^rhand$/);
  const proceduralBones = {
    leftUpperArm: findBone(/leftarm$/, /leftupperarm/, /lupperarm$/),
    rightUpperArm: findBone(/rightarm$/, /rightupperarm/, /rupperarm$/),
    leftUpperLeg: findBone(/leftupleg/, /leftupperleg/, /lthigh$/),
    rightUpperLeg: findBone(/rightupleg/, /rightupperleg/, /rthigh$/),
    spine: findBone(/^spine\\d*$/, /chest/)
  };
  // Use the cyborg's real torso chain for aim offsets while the hips turn
  // toward travel. The animation mixer pose is restored before each offset.
  const aimTwistBones = [
    { bone: findBone(/^spine$/), weight: 0.20 },
    { bone: findBone(/^spine01$/), weight: 0.28 },
    { bone: findBone(/^spine02$/), weight: 0.30 },
    { bone: findBone(/^neck$/), weight: 0.12 },
    { bone: findBone(/^head$/), weight: 0.10 }
  ].filter(entry => entry.bone).map(entry => ({
    ...entry,
    appliedAngle: 0,
    tempQuaternion: new THREE.Quaternion()
  }));
  const weapon = createWeaponModel(THREE, hand ? 1 : 0.35);
  if (hand) {
    weapon.position.set(0, -0.035, 0.055);
    weapon.rotation.set(Math.PI / 2, 0, Math.PI / 2);
    hand.add(weapon);
  } else {
    weapon.position.set(7, 24, 7);
    wrapper.add(weapon);
  }
  weapon.userData.baseRotationX = weapon.rotation.x;

  const mixer = new THREE.AnimationMixer(avatar);
  const actions = {};
  const patterns = {
    idle: /idle|stand|breath/i,
    walk: /walk|walking/i,
    run: /run|running|sprint/i,
    jump: /jump|fall/i,
    shoot: /shoot|fire|attack/i,
    reload: /reload/i,
    death: /death|die|dead/i
  };
  for (const [name, pattern] of Object.entries(patterns)) {
    const clip = animations.find(candidate => pattern.test(candidate.name));
    if (clip) actions[name] = mixer.clipAction(clip);
  }
  if (!actions.walk && animations.length) actions.walk = mixer.clipAction(animations[0]);
  // This cyborg asset contains walk and run clips only. Do not play a
  // locomotion clip as an idle animation; leave the rig in its neutral pose.

  const teamColor = new THREE.Color(PLAYER_COLORS[colorIndex % PLAYER_COLORS.length]);
  avatar.traverse(object => {
    if (!object.isMesh) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.forEach(material => {
      if (!material?.color) return;
      const materialName = material.name?.toLowerCase() || "";
      if (/cloth|shirt|jacket|pants|fabric|body/i.test(materialName)) {
        material.color.lerp(teamColor, 0.42);
      } else if (!/skin|face|hair|eye/i.test(materialName)) {
        material.color.lerp(teamColor, 0.12);
      }
    });
  });

  wrapper.userData = {
    isFallback: false,
    avatar,
    mixer,
    actions,
    activeAction: null,
    weapon,
    phase: 0,
    movementAmount: 0,
    lastX: null,
    lastY: 0,
    deathVisibleTime: 0,
    wasDead: false,
    currentAnimation: "idle",
    materials: [],
    proceduralBones,
    aimTwistBones,
    bodyAngle: null,
    moveAngle: null,
    motionSpeed: 0,
    isMoving: false,
    isRunning: false,
    reverseDirection: false,
    activeReverse: false,
    twistAxis: new THREE.Vector3(0, 1, 0),
    hitMaterial: null
  };
  return wrapper;
}
