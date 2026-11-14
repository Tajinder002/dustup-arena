import { ASSET_MANIFEST } from "./assetManifest.js";

export class EnvironmentLoader {
  constructor(THREE, renderer, logger = () => {}) {
    this.THREE = THREE;
    this.renderer = renderer;
    this.logger = logger;
    this.pmrem = new THREE.PMREMGenerator(renderer);
    this.pmrem.compileEquirectangularShader();
    this.loaded = false;
  }

  async load(scene) {
    if (this.loaded) return scene.environment || null;
    this.loaded = true;
    if (!this.THREE.RGBELoader) {
      scene.environment = this.createFallbackEnvironment();
      this.logger("RGBELoader unavailable; using generated environment reflections.");
      return scene.environment;
    }

    const urls = [ASSET_MANIFEST.environment.local, ASSET_MANIFEST.environment.remote];
    for (const url of urls) {
      try {
        const hdr = await this.loadHdr(url);
        const filtered = this.pmrem.fromEquirectangular(hdr).texture;
        scene.environment = filtered;
        hdr.dispose();
        this.logger(`Environment lighting loaded from ${url}`);
        return filtered;
      } catch (error) {
        this.logger(`HDRI unavailable at ${url}: ${error.message}`);
      }
    }

    scene.environment = this.createFallbackEnvironment();
    return scene.environment;
  }

  loadHdr(url) {
    return new Promise((resolve, reject) => {
      const loader = new this.THREE.RGBELoader();
      loader.setDataType(this.THREE.UnsignedByteType);
      let settled = false;
      const timeout = window.setTimeout(() => {
        if (settled) return;
        settled = true;
        reject(new Error(`Timed out loading HDR environment: ${url}`));
      }, 10000);
      loader.load(
        url,
        texture => {
          if (settled) {
            texture.dispose?.();
            return;
          }
          settled = true;
          window.clearTimeout(timeout);
          resolve(texture);
        },
        undefined,
        error => {
          if (settled) return;
          settled = true;
          window.clearTimeout(timeout);
          reject(error instanceof Error ? error : new Error(`Could not load HDR environment: ${url}`));
        }
      );
    });
  }

  createFallbackEnvironment() {
    const THREE = this.THREE;
    const faces = [];
    for (let face = 0; face < 6; face += 1) {
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 64;
      const context = canvas.getContext("2d");
      const gradient = context.createLinearGradient(0, 0, 0, 64);
      gradient.addColorStop(0, "#c8d5dc");
      gradient.addColorStop(0.52, "#8e9aa0");
      gradient.addColorStop(1, "#41474c");
      context.fillStyle = gradient;
      context.fillRect(0, 0, 64, 64);
      context.fillStyle = "rgba(255,255,255,.12)";
      for (let i = 0; i < 8; i += 1) context.fillRect((i * 17 + face * 9) % 60, 8 + (i % 3) * 15, 4, 3);
      faces.push(canvas);
    }
    const cube = new THREE.CubeTexture(faces);
    cube.needsUpdate = true;
    cube.mapping = THREE.CubeReflectionMapping;
    return cube;
  }

  dispose() {
    this.pmrem?.dispose();
  }
}
