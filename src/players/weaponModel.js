/** Low-cost blocky rifle with a readable stock, receiver, grip, magazine and barrel. */
export function createWeaponModel(THREE, scale = 1) {
  const weapon = new THREE.Group();
  weapon.name = "DustupCarbine";
  weapon.scale.setScalar(scale);

  const receiver = new THREE.MeshLambertMaterial({ color: 0x30363d });
  const polymer = new THREE.MeshLambertMaterial({ color: 0x181d22 });
  const steel = new THREE.MeshLambertMaterial({ color: 0x626d76 });

  const add = (geometry, material, x, y, z, rotation = null) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    if (rotation) mesh.rotation.set(rotation.x || 0, rotation.y || 0, rotation.z || 0);
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    weapon.add(mesh);
    return mesh;
  };

  // Barrel runs along local +Z.
  add(new THREE.BoxGeometry(4.8, 4.8, 19), receiver, 0, 0, 0);
  add(new THREE.BoxGeometry(4.4, 4.2, 9), polymer, 0, 0, -13);
  add(new THREE.BoxGeometry(5.2, 5.6, 11), polymer, 0, -0.2, 7);
  add(new THREE.BoxGeometry(4.1, 8.4, 4.6), polymer, 0, -5.8, -2);
  add(new THREE.BoxGeometry(3.8, 7.8, 5.2), polymer, 0, -7.4, 2.5);
  add(new THREE.CylinderGeometry(0.9, 0.9, 16, 6), steel, 0, 0.15, 20, { x: Math.PI / 2 });
  add(new THREE.BoxGeometry(1.2, 2.2, 5), steel, 0, 3.1, 1);
  add(new THREE.BoxGeometry(2.8, 2.1, 3.2), receiver, 0, 3.2, 2);

  const muzzleFlash = new THREE.Mesh(
    new THREE.SphereGeometry(2.4, 6, 4),
    new THREE.MeshBasicMaterial({ color: 0xffc56a })
  );
  muzzleFlash.position.set(0, 0.15, 29);
  muzzleFlash.visible = false;
  weapon.add(muzzleFlash);

  weapon.userData.muzzleFlash = muzzleFlash;
  weapon.userData.recoil = 0;
  weapon.userData.baseZ = weapon.position.z;
  weapon.userData.baseRotationX = weapon.rotation.x;
  return weapon;
}
