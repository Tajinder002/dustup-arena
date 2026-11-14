/** Detailed third-person carbine silhouette built from reusable PBR parts. */
export function createWeaponModel(THREE, scale = 1) {
  const weapon = new THREE.Group();
  weapon.name = "DustupCarbine";
  weapon.scale.setScalar(scale);
  const receiver = new THREE.MeshStandardMaterial({ color: 0x31383d, metalness: 0.82, roughness: 0.32 });
  const polymer = new THREE.MeshStandardMaterial({ color: 0x171c20, metalness: 0.12, roughness: 0.84 });
  const steel = new THREE.MeshStandardMaterial({ color: 0x778187, metalness: 0.92, roughness: 0.24 });
  const opticGlass = new THREE.MeshStandardMaterial({ color: 0x5f90a1, metalness: 0.65, roughness: 0.12, transparent: true, opacity: 0.86 });
  const add = (geometry, material, x, y, z, rotation = null) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    if (rotation) mesh.rotation.set(rotation.x || 0, rotation.y || 0, rotation.z || 0);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    weapon.add(mesh);
    return mesh;
  };

  // The barrel points along local +Z.
  add(new THREE.BoxGeometry(5.2, 5.5, 17), receiver, 0, 0, 2);
  add(new THREE.BoxGeometry(4.3, 4.4, 13), polymer, 0, -0.2, -12);
  add(new THREE.CylinderGeometry(1.35, 1.35, 25, 10), steel, 0, 0.4, 22, { x: Math.PI / 2 });
  add(new THREE.CylinderGeometry(2.6, 2.6, 3.5, 12), receiver, 0, 0.4, 34, { x: Math.PI / 2 });
  add(new THREE.BoxGeometry(7.2, 4.2, 13), polymer, 0, -5.6, -3);
  add(new THREE.BoxGeometry(4.4, 9.5, 5.2), polymer, 0, -8, 1, { z: -0.18 });
  add(new THREE.BoxGeometry(5.2, 11, 7), receiver, 0, -8, -7);
  add(new THREE.BoxGeometry(1.4, 1.8, 28), steel, 0, 3.2, 8);
  add(new THREE.BoxGeometry(7, 1.5, 17), polymer, 0, 3.7, 8);
  add(new THREE.BoxGeometry(2.2, 4.5, 3), receiver, 0, 5.8, -1);
  add(new THREE.BoxGeometry(4.8, 4, 5), receiver, 0, 5.1, 12);
  add(new THREE.BoxGeometry(3.2, 3.8, 3.2), opticGlass, 0, 6.5, 12);

  // Small handguard slots and barrel rings provide readable surface detail.
  for (let index = 0; index < 5; index += 1) {
    add(new THREE.BoxGeometry(0.7, 2.2, 2.1), steel, -3.1, 0.2, 8 + index * 3.2);
    add(new THREE.BoxGeometry(0.7, 2.2, 2.1), steel, 3.1, 0.2, 8 + index * 3.2);
  }

  const muzzleFlash = new THREE.Mesh(
    new THREE.SphereGeometry(5, 8, 6),
    new THREE.MeshBasicMaterial({ color: 0xffc56a, transparent: true, opacity: 0.9 })
  );
  muzzleFlash.position.set(0, 0.3, 39);
  muzzleFlash.visible = false;
  weapon.add(muzzleFlash);
  weapon.userData.muzzleFlash = muzzleFlash;
  weapon.userData.recoil = 0;
  weapon.userData.baseZ = weapon.position.z;
  weapon.userData.baseRotationX = weapon.rotation.x;
  return weapon;
}
