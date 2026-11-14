/** Promise-aware cache for glTF scenes and their animation clips. */
export class ModelCache {
  constructor() {
    this.entries = new Map();
  }

  get(key) {
    return this.entries.get(key);
  }

  set(key, value) {
    this.entries.set(key, value);
    return value;
  }

  getOrCreate(key, factory) {
    if (this.entries.has(key)) return this.entries.get(key);
    const promise = Promise.resolve().then(factory).catch(error => {
      this.entries.delete(key);
      throw error;
    });
    this.entries.set(key, promise);
    return promise;
  }

  cloneScene(THREE, scene) {
    if (THREE.SkeletonUtils?.clone) return THREE.SkeletonUtils.clone(scene);
    // A normal deep clone is adequate for static assets. Skinned models should
    // load SkeletonUtils (included by index.html) to receive independent rigs.
    return scene.clone(true);
  }
}
