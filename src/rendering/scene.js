import { EnvironmentLoader } from "../assets/environmentLoader.js";

export class SceneManager {
  constructor(state, THREE, mapManager, logger = () => {}) {
    this.state = state;
    this.THREE = THREE;
    this.mapManager = mapManager;
    this.logger = logger;
    this.environmentLoader = null;
  }

  initialize() {
    const THREE = this.THREE;
    const state = this.state;
    const mobile = state.isTouch;

    state.renderer = new THREE.WebGLRenderer({
      canvas: document.getElementById("gl"),
      antialias: !mobile,
      powerPreference: "high-performance"
    });
    state.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1 : 1.5));
    state.renderer.shadowMap.enabled = !mobile;
    state.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    state.renderer.outputEncoding = THREE.sRGBEncoding;
    state.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    state.renderer.toneMappingExposure = 1.08;

    state.scene = new THREE.Scene();
    state.camera = new THREE.PerspectiveCamera(70, 1, 0.1, 9000);

    state.ambientLight = new THREE.HemisphereLight(0xc9d8e8, 0x34302b, 0.72);
    state.scene.add(state.ambientLight);

    state.sunLight = new THREE.DirectionalLight(0xfff0da, 1.65);
    state.sunLight.position.set(360, 720, 280);
    state.sunLight.castShadow = !mobile;
    state.sunLight.shadow.mapSize.set(mobile ? 512 : 2048, mobile ? 512 : 2048);
    state.sunLight.shadow.camera.left = -1500;
    state.sunLight.shadow.camera.right = 1500;
    state.sunLight.shadow.camera.top = 1300;
    state.sunLight.shadow.camera.bottom = -1300;
    state.sunLight.shadow.camera.near = 10;
    state.sunLight.shadow.camera.far = 2400;
    state.sunLight.shadow.bias = -0.00035;
    state.scene.add(state.sunLight);

    state.fillLight = new THREE.DirectionalLight(0x93a9c8, 0.35);
    state.fillLight.position.set(-500, 260, -400);
    state.scene.add(state.fillLight);

    state.bulletGeometry = new THREE.SphereGeometry(2.5, 10, 8);
    state.bulletMaterial = new THREE.MeshStandardMaterial({
      color: 0xffe7a0,
      emissive: 0xffad44,
      emissiveIntensity: 1.1,
      metalness: 0.45,
      roughness: 0.3
    });

    this.environmentLoader = new EnvironmentLoader(THREE, state.renderer, this.logger);
    this.environmentLoader.load(state.scene).catch(error => this.logger(`Environment setup failed: ${error.message}`));

    this.resize();
    window.addEventListener("resize", () => this.resize());
    this.mapManager.buildMap();
  }

  resize() {
    const state = this.state;
    if (!state.renderer || !state.camera) return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    state.renderer.setSize(width, height);
    state.camera.aspect = width / height;
    state.camera.updateProjectionMatrix();

    const hudCanvas = document.getElementById("c");
    hudCanvas.width = width;
    hudCanvas.height = height;
  }
}
