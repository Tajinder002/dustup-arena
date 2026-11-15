/** Minimal low-cost third-person rifle silhouette. */
export function createWeaponModel(THREE, scale = 1) {
  const weapon = new THREE.Group();
  weapon.name = "DustupCarbine";
  weapon.scale.setScalar(scale);

  const dark = new THREE.MeshLambertMaterial({ color: 0x242a30 });
  const steel = new THREE.MeshLambertMaterial({ color: 0x59636b });
  const add = (geometry, material, x, y, z, rotation = null) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    if (rotation) mesh.rotation.set(rotation.x || 0, rotation.y || 0, rotation.z || 0);
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    weapon.add(mesh);
    return mesh;
  };

  // Barrel points along local +Z.
  add(new THREE.BoxGeometry(4.2, 4.2, 22), dark, 0, 0, 0);
  add(new THREE.BoxGeometry(3.4, 3.7, 11), dark, 0, -0.4, -15);
  add(new THREE.CylinderGeometry(0.8, 0.8, 20, 6), steel, 0, 0.2, 20, { x: Math.PI / 2 });
  add(new THREE.BoxGeometry(3.2, 8, 4.5), dark, 0, -5.5, -2);

  const muzzleFlash = new THREE.Mesh(
    new THREE.SphereGeometry(2.2, 6, 4),
    new THREE.MeshBasicMaterial({ color: 0xffc56a })
  );
  muzzleFlash.position.set(0, 0.2, 31);
  muzzleFlash.visible = false;
  weapon.add(muzzleFlash);

  weapon.userData.muzzleFlash = muzzleFlash;
  weapon.userData.recoil = 0;
  weapon.userData.baseZ = weapon.position.z;
  weapon.userData.baseRotationX = weapon.rotation.x;
  return weapon;
}
