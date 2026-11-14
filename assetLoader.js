import { ModelCache } from "./modelCache.js";

export class AssetLoader {
  constructor(THREE, { onProgress = () => {}, logger = () => {} } = {}) {
    this.THREE = THREE;
    this.onProgress = onProgress;
    this.logger = logger;
    this.cache = new ModelCache();
    this.gltfLoader = THREE.GLTFLoader ? new THREE.GLTFLoader() : null;
    this.loading = new Set();
  }

  get available() {
    return Boolean(this.gltfLoader);
  }

  loadModel(url, label = url) {
    if (!this.gltfLoader) {
      return Promise.reject(new Error("GLTFLoader is unavailable. Check the Three.js loader script."));
    }

    return this.cache.getOrCreate(url, () => new Promise((resolve, reject) => {
      this.loading.add(url);
      this.onProgress({ label, loaded: 0, total: 0, phase: "loading" });
      let settled = false;
      const timeout = window.setTimeout(() => {
        if (settled) return;
        settled = true;
        this.loading.delete(url);
        reject(new Error(`Timed out loading ${label}`));
      }, 14000);
      this.gltfLoader.load(
        url,
        gltf => {
          if (settled) return;
          settled = true;
          window.clearTimeout(timeout);
          this.loading.delete(url);
          this.onProgress({ label, loaded: 1, total: 1, phase: "complete" });
          resolve(gltf);
        },
        event => {
          if (!settled && event.lengthComputable) {
            this.onProgress({ label, loaded: event.loaded, total: event.total, phase: "loading" });
          }
        },
        error => {
          if (settled) return;
          settled = true;
          window.clearTimeout(timeout);
          this.loading.delete(url);
          this.logger(`Asset load failed (${label}): ${error?.message || error}`);
          reject(error instanceof Error ? error : new Error(`Could not load ${label}`));
        }
      );
    }));
  }

  async loadFirstAvailable(candidates, label = "3D model") {
    const errors = [];
    for (const url of candidates.filter(Boolean)) {
      try {
        const gltf = await this.loadModel(url, label);
        return { ...gltf, sourceUrl: url };
      } catch (error) {
        errors.push(`${url}: ${error.message}`);
      }
    }
    throw new Error(`No source could load for ${label}. ${errors.join(" | ")}`);
  }

  cloneScene(scene) {
    return this.cache.cloneScene(this.THREE, scene);
  }
}
